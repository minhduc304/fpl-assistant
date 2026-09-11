# Polls FplClient for bootstrap-static and fixtures data. Bootstrap-static is
# fetched first because fixtures' TTL (and this job's own live_gameweek?
# check) depend on bootstrap-static's cached events[] being present.
#
# Cadence: FPL data should refresh every 5 minutes during a live gameweek,
# every 30 minutes otherwise. solid_queue's recurring.yml only supports a
# single static schedule per task -- it has no runtime mechanism to swap a
# job between two cron-like schedules. So rather than trying to dynamically
# reschedule, this job is registered in config/recurring.yml to run every 5
# minutes, unconditionally, and lets FplClient's own cache-through TTL logic
# do the actual cadence gating:
#
#   - Live gameweek: FplClient's TTL is 5 minutes, so every 5-minute run of
#     this job lands right when the cache has just expired -> a real fetch
#     happens every run, giving the 5-minute live cadence.
#   - Off-peak: FplClient's TTL is 30 minutes, so most of these 5-minute runs
#     hit a warm cache and no-op (no HTTP call) -- only roughly every 6th run
#     actually fetches, yielding the 30-minute off-peak cadence for free.
#
# In short: this job's job is to poll often enough to catch the tighter live
# cadence; FplClient's existing TTL enforces "don't fetch more often than
# necessary" the rest of the time.
class IngestFplDataJob < ApplicationJob
  queue_as :default

  def perform
    FplClient.bootstrap_static
    FplClient.fixtures

    Rails.logger.info("[IngestFplDataJob] ingest run complete (live_gameweek=#{live_gameweek?})")
  end

  # Same rule FplClient applies internally (an event whose deadline_time has
  # passed but isn't finished yet), but read directly from ApiCache rather
  # than reaching into FplClient's private API. Used here for observability
  # only -- it does not gate whether this job performs its fetch; see the
  # cadence comment above for why that gating happens inside FplClient's TTL
  # instead of here.
  def live_gameweek?
    bootstrap = ApiCache.find_by(resource: "bootstrap-static")
    return false unless bootstrap&.payload

    Array(bootstrap.payload["events"]).any? do |event|
      deadline = event["deadline_time"]
      next false if deadline.blank?

      Time.zone.parse(deadline).past? && !event["finished"]
    end
  end
end
