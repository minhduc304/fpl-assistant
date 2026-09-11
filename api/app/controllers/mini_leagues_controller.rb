# GET /mini-leagues/:league_id/standings (openapi.yaml's getMiniLeagueStandings).
class MiniLeaguesController < ApplicationController
  def standings
    result = MiniLeagueStandings.for(league_id: params[:league_id])
    render json: serialize(result), status: :ok
  rescue FplClient::NotFoundError
    render json: { message: "That league ID doesn't exist or isn't public" }, status: :not_found
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  def serialize(result)
    body = {
      league_id: result.league_id,
      league_name: result.league_name,
      standings: result.entries.map do |e|
        {
          rank: e.rank,
          team_id: e.team_id,
          team_name: e.team_name,
          total_points: e.total_points
        }
      end,
      stale: !!result.stale
    }
    body[:data_as_of] = result.data_as_of if result.data_as_of
    body
  end
end
