# GET /teams/:team_id/compare/:rival_team_id (openapi.yaml's compareRivalTeam operation).
class TeamComparisonsController < ApplicationController
  def show
    team = TeamSummary.for(team_id: params[:team_id])
    rival_team = TeamSummary.for(team_id: params[:rival_team_id])
    render json: serialize(team, rival_team), status: :ok
  rescue FplClient::NotFoundError
    render json: { message: "That team ID doesn't exist" }, status: :not_found
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  def serialize(team, rival_team)
    body = {
      team: core(team),
      rival_team: core(rival_team),
      stale: team.stale || rival_team.stale
    }
    timestamps = [ team.data_as_of, rival_team.data_as_of ].compact
    body[:data_as_of] = timestamps.max unless timestamps.empty?
    body
  end

  def core(team)
    {
      team_id: team.team_id,
      name: team.name,
      manager_name: team.manager_name,
      overall_rank: team.overall_rank,
      total_points: team.total_points
    }
  end
end
