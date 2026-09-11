# Plain Ruby response shape (not ActiveRecord-backed) for every "opinionated"
# tool (captain suggestion, transfer suggestion, chip timing — TDD-fpl-assistant.md,
# "Recommendation-contract behavior"). Mirrors PRD-fpl-assistant.md §6's
# recommendation contract:
#
#   { recommendation, confidence, reasoning[], alternatives[] }
#
# `recommendation` and `alternatives[].option` are intentionally left as plain
# Ruby objects (Hash, etc.) rather than a fixed struct, because their internal
# shape differs per tool — e.g. suggest_captain's recommendation is
# { player_id, name }, while suggest_transfer's is { option: { player_out, player_in } }.
class RecommendationContract
  # Confidence-labeling thresholds (TDD-fpl-assistant.md, "Confidence labeling"):
  # derived from the sample size (relevant gameweeks) behind a recommendation.
  #   fewer than LOW_CONFIDENCE_MAX_GAMEWEEKS gameweeks       -> "low"
  #   MEDIUM_CONFIDENCE_MIN_GAMEWEEKS..HIGH_CONFIDENCE_MIN_GAMEWEEKS-1 -> "medium"
  #   HIGH_CONFIDENCE_MIN_GAMEWEEKS or more                   -> "high"
  LOW_CONFIDENCE_MAX_GAMEWEEKS = 3
  MEDIUM_CONFIDENCE_MIN_GAMEWEEKS = 3
  HIGH_CONFIDENCE_MIN_GAMEWEEKS = 10

  ReasoningFactor = Struct.new(:factor, :detail, :sample_size, keyword_init: true)

  Alternative = Struct.new(:option, :reasoning, :why_not_top_pick, keyword_init: true)

  attr_reader :recommendation, :confidence, :reasoning, :alternatives

  def initialize(recommendation:, confidence:, reasoning:, alternatives:)
    @recommendation = recommendation
    @confidence = confidence
    @reasoning = reasoning
    @alternatives = alternatives
  end

  def self.confidence_for(relevant_gameweeks)
    return "low" if relevant_gameweeks < LOW_CONFIDENCE_MAX_GAMEWEEKS
    return "high" if relevant_gameweeks >= HIGH_CONFIDENCE_MIN_GAMEWEEKS

    "medium"
  end
end
