# GET /fixtures (openapi.yaml's getFixtures operation).
class FixturesController < ApplicationController
  def index
    result = FixtureBoard.list(gameweek: integer_param(:gameweek), team_id: integer_param(:teamId))
    render json: serialize(result), status: :ok
  rescue FplClient::UnavailableError
    render json: { message: "live data temporarily unavailable, try again shortly" }, status: :service_unavailable
  end

  private

  # Coerce to Integer when present and numeric; ignore otherwise.
  def integer_param(key)
    value = params[key]
    return nil if value.blank?

    Integer(value, 10)
  rescue ArgumentError, TypeError
    nil
  end

  def serialize(result)
    body = {
      fixtures: result.fixtures.map do |fixture|
        {
          gameweek: fixture.gameweek,
          home_team: fixture.home_team,
          away_team: fixture.away_team,
          difficulty_home: fixture.difficulty_home,
          difficulty_away: fixture.difficulty_away,
          is_double_gameweek: fixture.is_double_gameweek,
          is_blank_gameweek: fixture.is_blank_gameweek
        }
      end,
      stale: !!result.stale
    }
    body[:data_as_of] = result.data_as_of if result.data_as_of
    body
  end
end
