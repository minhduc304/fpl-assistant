# FplClient is the ONLY place in the app allowed to call the FPL public API.
# Everything else must go through this class so caching/backoff/TTL stay centralized.
#
# Cache-through strategy (backed by the `api_cache` table / ApiCache model):
#   - Cache hit within TTL  -> return cached payload, no HTTP call.
#   - Cache miss/expired    -> fetch from FPL (5s timeout, up to 3 attempts,
#                              backoff 1s then 2s between attempts).
#   - All attempts fail     -> serve stale cache if a row exists (tagged as
#                              stale), otherwise raise FplClient::UnavailableError.
#     No raw HTTP exception ever escapes this class.
#
# TTL: 5 minutes while a gameweek is live, 30 minutes otherwise. "Live" means
# bootstrap-static's cached `events[]` contains an event whose deadline_time
# has passed but which isn't finished yet. If bootstrap-static has no cached
# row yet, we default to the off-peak (30 min) TTL rather than forcing a fetch.
class FplClient
  BASE_URL = "https://fantasy.premierleague.com/api/".freeze

  RESOURCE_PATHS = {
    "bootstrap-static" => "bootstrap-static/",
    "fixtures" => "fixtures/"
  }.freeze

  OFF_PEAK_TTL = 30.minutes
  LIVE_TTL = 5.minutes
  SQUAD_TTL = 6.hours

  REQUEST_TIMEOUT = 5 # seconds
  MAX_ATTEMPTS = 3
  RETRY_DELAYS = [1, 2].freeze # seconds, after attempt 1 and attempt 2 respectively

  Result = Struct.new(:payload, :stale, :fetched_at, keyword_init: true) do
    def stale?
      !!stale
    end
  end

  # Raised when a resource can't be fetched and there is no cached row at all
  # to fall back on (a "degraded state" the caller must handle explicitly).
  class UnavailableError < StandardError; end

  # Raised when FPL returns a real HTTP 404 for a resource (e.g. a nonexistent
  # manager id). Deterministic: never retried, never served from stale cache.
  class NotFoundError < StandardError; end

  # Internal: all attempts to reach the FPL API for this fetch failed.
  class FetchFailedError < StandardError; end

  class << self
    def bootstrap_static
      fetch("bootstrap-static")
    end

    def fixtures
      fetch("fixtures")
    end

    def entry(team_id)
      fetch("entry/#{team_id}", path: "entry/#{team_id}/")
    end

    def picks(team_id, gameweek)
      fetch("entry/#{team_id}/picks", path: "entry/#{team_id}/event/#{gameweek}/picks/")
    end

    def history(team_id)
      fetch("entry/#{team_id}/history", path: "entry/#{team_id}/history/")
    end

    def league_standings(league_id)
      fetch("leagues-classic/#{league_id}/standings", path: "leagues-classic/#{league_id}/standings/")
    end

    private

    def fetch(resource, path: nil)
      path ||= RESOURCE_PATHS.fetch(resource)
      cached = ApiCache.find_by(resource: resource)
      return Result.new(payload: cached.payload, stale: false, fetched_at: cached.fetched_at) if cached && fresh?(cached)

      begin
        payload = fetch_with_retries(path)
        row = upsert_cache(resource, payload)
        Result.new(payload: row.payload, stale: false, fetched_at: row.fetched_at)
      rescue FetchFailedError
        raise UnavailableError, "FPL API unavailable and no cached data for '#{resource}'" unless cached

        Result.new(payload: cached.payload, stale: true, fetched_at: cached.fetched_at)
      end
    end

    def fresh?(cached_row)
      return false unless cached_row.fetched_at

      Time.current - cached_row.fetched_at < ttl_for(cached_row.resource)
    end

    def ttl_for(resource)
      return SQUAD_TTL if resource.to_s.start_with?("entry/")

      live_gameweek? ? LIVE_TTL : OFF_PEAK_TTL
    end

    def live_gameweek?
      bootstrap = ApiCache.find_by(resource: "bootstrap-static")
      return false unless bootstrap&.payload

      Array(bootstrap.payload["events"]).any? do |event|
        deadline = event["deadline_time"]
        next false if deadline.blank?

        Time.zone.parse(deadline).past? && !event["finished"]
      end
    end

    def fetch_with_retries(path)
      last_error = nil

      MAX_ATTEMPTS.times do |attempt_index|
        return perform_request(path)
      rescue NotFoundError
        raise
      rescue StandardError => e
        last_error = e
        sleep(RETRY_DELAYS[attempt_index]) if RETRY_DELAYS[attempt_index]
      end

      raise FetchFailedError, last_error&.message
    end

    def perform_request(path)
      response = connection.get(path)
      # 403 is grouped with 404: FPL returns 403 for private leagues, and no other
      # resource this client calls returns 403 -- both mean "not accessible", so a
      # deterministic NotFoundError beats a misleading UnavailableError.
      raise NotFoundError, "FPL returned #{response.status} for '#{path}'" if [ 404, 403 ].include?(response.status)
      raise Faraday::Error, "Unexpected response status #{response.status}" unless response.success?

      JSON.parse(response.body)
    end

    def connection
      Faraday.new(url: BASE_URL) do |conn|
        conn.options.open_timeout = REQUEST_TIMEOUT
        conn.options.timeout = REQUEST_TIMEOUT
        conn.adapter Faraday.default_adapter
      end
    end

    def upsert_cache(resource, payload)
      row = ApiCache.find_or_initialize_by(resource: resource)
      row.payload = payload
      row.fetched_at = Time.current
      row.save!
      row
    end
  end
end
