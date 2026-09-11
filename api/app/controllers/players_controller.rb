# Player read endpoints (openapi.yaml: getPlayerStats, searchPlayers, comparePlayers).
class PlayersController < ApplicationController
  UNAVAILABLE_MESSAGE = "live data temporarily unavailable, try again shortly".freeze

  # GET /players/:player_id (getPlayerStats)
  def show
    player = PlayerCatalog.find(params[:player_id])
    render json: serialize_show(player), status: :ok
  rescue PlayerCatalog::NotFoundError
    render json: { message: "That player ID doesn't exist" }, status: :not_found
  rescue FplClient::UnavailableError
    render json: { message: UNAVAILABLE_MESSAGE }, status: :service_unavailable
  end

  # GET /players (searchPlayers)
  def index
    result = PlayerCatalog.search(
      query: params[:query],
      position: params[:position],
      team: params[:team]
    )
    render json: serialize_list(result), status: :ok
  rescue FplClient::UnavailableError
    render json: { message: UNAVAILABLE_MESSAGE }, status: :service_unavailable
  end

  # GET /players/compare (comparePlayers)
  def compare
    ids = parse_player_ids(params[:playerIds])
    return render_compare_error if ids.size < 2

    result = PlayerCatalog.by_ids(ids)
    return render_compare_error if result.players.size < 2

    render json: serialize_list(result), status: :ok
  rescue FplClient::UnavailableError
    render json: { message: UNAVAILABLE_MESSAGE }, status: :service_unavailable
  end

  private

  def parse_player_ids(raw)
    raw.to_s.split(",").map(&:strip).select { |s| s.match?(/\A\d+\z/) }.map(&:to_i)
  end

  def render_compare_error
    render json: { message: "At least two playerIds are required for comparison" }, status: :bad_request
  end

  def serialize_player(player)
    {
      player_id: player.player_id,
      name: player.name,
      team: player.team,
      position: player.position,
      price: player.price,
      total_points: player.total_points,
      form: player.form
    }
  end

  def serialize_show(player)
    body = serialize_player(player)
    body[:data_as_of] = player.data_as_of if player.data_as_of
    body[:stale] = !!player.stale
    body
  end

  def serialize_list(result)
    body = {
      players: result.players.map { |p| serialize_player(p) },
      stale: !!result.stale
    }
    body[:data_as_of] = result.data_as_of if result.data_as_of
    body
  end
end
