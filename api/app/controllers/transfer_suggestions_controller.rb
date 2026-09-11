# GET /teams/:team_id/suggest-transfer (openapi.yaml's suggestTransfer operation).
class TransferSuggestionsController < ApplicationController
  RISK_TOLERANCES = %w[safe balanced differential].freeze
  DEFAULT_RISK = "balanced".freeze

  def show
    result = RecommendationBuilder.suggest_transfer(
      team_id: params[:team_id],
      risk_tolerance: risk_tolerance
    )
    render json: result, status: :ok
  rescue FplClient::NotFoundError
    render json: { message: "That team ID doesn't exist" }, status: :not_found
  rescue FplClient::UnavailableError, RecommendationBuilder::NoTransferCandidateError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  # Out-of-enum values coerce to the default, matching the captain controller's
  # lenient parameter handling.
  def risk_tolerance
    value = params[:risk_tolerance].to_s
    RISK_TOLERANCES.include?(value) ? value : DEFAULT_RISK
  end
end
