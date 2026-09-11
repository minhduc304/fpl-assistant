# Shared chart-series service (todo.md Task 37). Turns an `entry/{id}/history/`
# payload's `current[]` array into a `ChartData`-shaped series, parsed here in
# exactly one place, consumed by the getChartData controller (Task 37).
#
# `type` maps to `current[]` fields:
#   points_per_gameweek -> { x: event, y: points }
#   rank_trajectory     -> { x: event, y: overall_rank }
#   price_history       -> { x: event, y: value / 10 }  (team squad value per
#                          gameweek -- decided 2026-09-10, see tasks/plan.md
#                          Open Questions; `value` is in tenths of a million)
#
# NotFoundError / UnavailableError from FplClient propagate unchanged -- the
# controller layer maps them.
class ChartSeries
  TYPES = %w[points_per_gameweek rank_trajectory price_history].freeze

  Series = Struct.new(:type, :points, :data_as_of, :stale, keyword_init: true)

  class InvalidTypeError < StandardError; end

  class << self
    def for(team_id:, type:)
      raise InvalidTypeError, "Unknown chart type #{type.inspect}" unless TYPES.include?(type)

      result = FplClient.history(team_id)
      rows = Array(result.payload["current"])

      Series.new(
        type: type,
        points: rows.map { |row| point_for(type, row) },
        data_as_of: result.stale? ? result.fetched_at.iso8601 : nil,
        stale: result.stale?
      )
    end

    private

    def point_for(type, row)
      case type
      when "points_per_gameweek" then { x: row["event"], y: row["points"] }
      when "rank_trajectory"     then { x: row["event"], y: row["overall_rank"] }
      when "price_history"       then { x: row["event"], y: row["value"].to_f / 10 }
      end
    end
  end
end
