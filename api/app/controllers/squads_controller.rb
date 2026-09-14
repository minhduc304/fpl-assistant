# GET /teams/:team_id/squad (openapi.yaml's getSquad operation).
class SquadsController < ApplicationController
  def show
    squad = SquadAssembler.for(team_id: params[:team_id])
    render json: serialize(squad), status: :ok
  rescue FplClient::NotFoundError
    render json: { message: "That team ID doesn't exist" }, status: :not_found
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  def serialize(squad)
    body = {
      team_id: params[:team_id].to_i,
      formation: squad.formation,
      picks: squad.picks.map do |pick|
        {
          player_id: pick.player_id,
          name: pick.name,
          position: pick.position,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
          is_starting: pick.starting
        }
      end,
      stale: !!squad.stale
    }
    body[:data_as_of] = squad.data_as_of if squad.data_as_of
    body
  end
end
