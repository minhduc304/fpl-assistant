# GET /teams/:team_id (openapi.yaml's getTeam operation).
class TeamsController < ApplicationController
  def show
    team = TeamSummary.for(team_id: params[:team_id])
    render json: serialize(team), status: :ok
  rescue FplClient::NotFoundError
    render json: { message: "That team ID doesn't exist" }, status: :not_found
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  def serialize(team)
    body = {
      team_id: team.team_id,
      name: team.name,
      manager_name: team.manager_name,
      overall_rank: team.overall_rank,
      total_points: team.total_points,
      stale: !!team.stale
    }
    body[:data_as_of] = team.data_as_of if team.data_as_of
    body
  end
end
