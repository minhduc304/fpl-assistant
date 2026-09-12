# Turns an `entry/{id}/` payload into a Team-shaped record, parsed here in
# exactly one place, consumed by the getTeam controller and
# TeamComparisonsController.
#
# NotFoundError / UnavailableError from FplClient propagate unchanged — the
# controller layer maps them.
class TeamSummary
  Team = Struct.new(
    :team_id, :name, :manager_name, :overall_rank, :total_points, :data_as_of, :stale,
    keyword_init: true
  )

  class << self
    def for(team_id:)
      result = FplClient.entry(team_id)
      payload = result.payload

      Team.new(
        team_id: payload["id"] || team_id.to_i,
        name: payload["name"],
        manager_name: "#{payload['player_first_name']} #{payload['player_last_name']}".strip,
        overall_rank: payload["summary_overall_rank"],
        total_points: payload["summary_overall_points"],
        data_as_of: result.stale? ? result.fetched_at.iso8601 : nil,
        stale: result.stale?
      )
    end
  end
end
