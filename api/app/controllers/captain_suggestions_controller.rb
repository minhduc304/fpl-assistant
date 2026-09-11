# GET /teams/:team_id/suggest-captain (openapi.yaml's suggestCaptain operation).
class CaptainSuggestionsController < ApplicationController
  TEAM_ID_FORMAT = /\A[1-9]\d*\z/

  def show
    return render_invalid_team_id unless params[:team_id].to_s.match?(TEAM_ID_FORMAT)

    # Real existence check via the FPL entry endpoint (BL-004): an unknown
    # team id raises FplClient::NotFoundError -> a real 404.
    FplClient.entry(params[:team_id])

    result = RecommendationBuilder.suggest_captain(team_id: params[:team_id], gameweek: params[:gameweek])
    render json: result, status: :ok
  rescue FplClient::NotFoundError
    render_invalid_team_id
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  def render_invalid_team_id
    render json: { message: "That team ID doesn't exist" }, status: :not_found
  end
end
