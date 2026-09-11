# Shared mini-league-standings service (todo.md Task 38). Turns a
# `leagues-classic/{id}/standings/` payload into the standings response, parsed
# here in exactly one place, consumed by the getMiniLeagueStandings controller.
#
# Single page only -- `standings.has_next` is intentionally NOT followed; the
# contract returns the first page of results.
#
# NotFoundError / UnavailableError from FplClient propagate unchanged -- the
# controller layer maps them (NotFoundError covers both nonexistent and private
# leagues, per FplClient.league_standings).
class MiniLeagueStandings
  Standings = Struct.new(
    :league_id, :league_name, :entries, :data_as_of, :stale, keyword_init: true
  )

  Entry = Struct.new(:rank, :team_id, :team_name, :total_points, keyword_init: true)

  class << self
    def for(league_id:)
      result = FplClient.league_standings(league_id)
      payload = result.payload
      results = Array(payload.dig("standings", "results"))

      Standings.new(
        league_id: payload.dig("league", "id") || league_id.to_i,
        league_name: payload.dig("league", "name"),
        entries: results.map do |r|
          Entry.new(
            rank: r["rank"],
            team_id: r["entry"],
            team_name: r["entry_name"],
            total_points: r["total"]
          )
        end,
        data_as_of: result.stale? ? result.fetched_at.iso8601 : nil,
        stale: result.stale?
      )
    end
  end
end
