# Turns raw FPL data into the manager's current 15-player squad. The
# `entry/{id}/event/{gw}/picks` payload is parsed here in exactly one place,
# consumed by both the get_squad controller and
# RecommendationBuilder.suggest_transfer.
#
# NotFoundError / UnavailableError from FplClient propagate unchanged — the
# controller layer maps them.
class SquadAssembler
  STARTING_POSITIONS = (1..11).freeze

  Pick = Struct.new(
    :player_id, :name, :position, :is_captain, :is_vice_captain, :now_cost, :element_type, :starting,
    keyword_init: true
  )

  Squad = Struct.new(
    :picks, :formation, :bank, :current_event, :data_as_of, :stale,
    keyword_init: true
  )

  class << self
    def for(team_id:)
      entry_result = FplClient.entry(team_id)
      current_event = entry_result.payload["current_event"]

      picks_result, gameweek = resolve_picks(team_id, current_event)
      bootstrap_result = FplClient.bootstrap_static

      elements = index_by_id(bootstrap_result.payload["elements"])
      element_types = index_by_id(bootstrap_result.payload["element_types"])

      raw_picks = Array(picks_result&.payload&.fetch("picks", nil))
      contributing = [ entry_result, picks_result, bootstrap_result ].compact

      Squad.new(
        picks: build_picks(raw_picks, elements, element_types),
        formation: formation_for(raw_picks, elements, element_types),
        bank: picks_result&.payload&.dig("entry_history", "bank"),
        current_event: gameweek,
        data_as_of: data_as_of(contributing),
        stale: contributing.any?(&:stale?)
      )
    end

    private

    # Normal path: try current_event, then current_event - 1 (pre-deadline window
    # or season not started leaves the current gameweek with no picks). Returns
    # the first Result whose payload carries a non-empty picks array, plus the
    # gameweek it came from. Falls back to [nil, current_event] when none do.
    def resolve_picks(team_id, current_event)
      candidate_gameweeks(current_event).each do |gameweek|
        result = FplClient.picks(team_id, gameweek)
        return [ result, gameweek ] if Array(result.payload["picks"]).any?
      end

      [ nil, current_event ]
    end

    def candidate_gameweeks(current_event)
      return [] unless current_event.is_a?(Integer) && current_event >= 1

      [ current_event, current_event - 1 ].select { |gameweek| gameweek >= 1 }
    end

    def build_picks(raw_picks, elements, element_types)
      raw_picks.map do |raw|
        element = elements.fetch(raw["element"], {})
        element_type = element_types.fetch(element["element_type"], {})

        Pick.new(
          player_id: raw["element"],
          name: element["web_name"],
          position: element_type["singular_name_short"],
          is_captain: !!raw["is_captain"],
          is_vice_captain: !!raw["is_vice_captain"],
          now_cost: element["now_cost"],
          element_type: element["element_type"],
          starting: STARTING_POSITIONS.cover?(raw["position"])
        )
      end
    end

    # Count the 11 starting picks by position short-name and format as
    # DEF-MID-FWD (a GKP is always 1 and omitted, per standard FPL notation).
    def formation_for(raw_picks, elements, element_types)
      counts = Hash.new(0)

      raw_picks.each do |raw|
        next unless STARTING_POSITIONS.cover?(raw["position"])

        element = elements.fetch(raw["element"], {})
        element_type = element_types.fetch(element["element_type"], {})
        counts[element_type["singular_name_short"]] += 1
      end

      [ counts["DEF"], counts["MID"], counts["FWD"] ].join("-")
    end

    def index_by_id(collection)
      Array(collection).index_by { |item| item["id"] }
    end

    def data_as_of(results)
      stale_results = results.select(&:stale?)
      return nil if stale_results.empty?

      stale_results.max_by(&:fetched_at).fetched_at.iso8601
    end
  end
end
