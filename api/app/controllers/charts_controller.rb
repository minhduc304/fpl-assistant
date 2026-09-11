# GET /teams/:team_id/charts (openapi.yaml's getChartData operation).
class ChartsController < ApplicationController
  TYPE_ERROR_MESSAGE = "type must be one of: #{ChartSeries::TYPES.join(', ')}".freeze

  def show
    type = params[:type]
    return render_type_error unless ChartSeries::TYPES.include?(type)

    series = ChartSeries.for(team_id: params[:team_id], type: type)
    render json: serialize(series), status: :ok
  rescue ChartSeries::InvalidTypeError
    render_type_error
  rescue FplClient::NotFoundError
    render json: { message: "That team ID doesn't exist" }, status: :not_found
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  def render_type_error
    render json: { message: TYPE_ERROR_MESSAGE }, status: :bad_request
  end

  def serialize(series)
    body = {
      type: series.type,
      points: series.points.map { |p| { x: p[:x], y: p[:y] } },
      stale: !!series.stale
    }
    body[:data_as_of] = series.data_as_of if series.data_as_of
    body
  end
end
