require "rails_helper"

# Cross-checked against TDD-fpl-assistant.md, "MCP tool schemas" worked examples
# for suggest_captain and suggest_transfer.
RSpec.describe RecommendationContract do
  describe "confidence thresholds" do
    it "exposes the TDD's gameweek-count boundaries as named constants" do
      expect(RecommendationContract::LOW_CONFIDENCE_MAX_GAMEWEEKS).to eq(3)
      expect(RecommendationContract::MEDIUM_CONFIDENCE_MIN_GAMEWEEKS).to eq(3)
      expect(RecommendationContract::HIGH_CONFIDENCE_MIN_GAMEWEEKS).to eq(10)
    end

    it "labels fewer than 3 relevant gameweeks as low" do
      expect(RecommendationContract.confidence_for(0)).to eq("low")
      expect(RecommendationContract.confidence_for(2)).to eq("low")
    end

    it "labels 3-10 relevant gameweeks as medium" do
      expect(RecommendationContract.confidence_for(3)).to eq("medium")
      expect(RecommendationContract.confidence_for(9)).to eq("medium")
    end

    it "labels 10+ relevant gameweeks as high" do
      expect(RecommendationContract.confidence_for(10)).to eq("high")
      expect(RecommendationContract.confidence_for(25)).to eq("high")
    end
  end

  describe "suggest_captain shape" do
    it "matches the TDD worked example verbatim" do
      contract = RecommendationContract.new(
        recommendation: { player_id: 302, name: "Erling Haaland" },
        confidence: "high",
        reasoning: [
          RecommendationContract::ReasoningFactor.new(
            factor: "fixture_difficulty",
            detail: "Home vs. bottom-of-table opposition (FDR 2)",
            sample_size: 12
          )
        ],
        alternatives: [
          RecommendationContract::Alternative.new(
            option: { player_id: 233, name: "Mohamed Salah" },
            reasoning: [
              RecommendationContract::ReasoningFactor.new(
                factor: "recent_form",
                detail: "3 goal involvements in last 4 gameweeks",
                sample_size: 4
              )
            ],
            why_not_top_pick: "Tougher away fixture (FDR 4) this gameweek"
          )
        ]
      )

      expect(contract.recommendation).to eq(player_id: 302, name: "Erling Haaland")
      expect(contract.confidence).to eq("high")
      expect(contract.reasoning.first.factor).to eq("fixture_difficulty")
      expect(contract.reasoning.first.sample_size).to eq(12)

      alternative = contract.alternatives.first
      expect(alternative.option).to eq(player_id: 233, name: "Mohamed Salah")
      expect(alternative.reasoning.first.factor).to eq("recent_form")
      expect(alternative.why_not_top_pick).to eq("Tougher away fixture (FDR 4) this gameweek")
    end
  end

  describe "suggest_transfer shape" do
    it "matches the TDD worked example verbatim (recommendation.option = { player_out, player_in })" do
      contract = RecommendationContract.new(
        recommendation: {
          option: { player_out: { player_id: 101, name: "Declan Rice" },
                     player_in: { player_id: 302, name: "Erling Haaland" } }
        },
        confidence: "medium",
        reasoning: [
          RecommendationContract::ReasoningFactor.new(
            factor: "expected_points_delta",
            detail: "Projected +2.4 pts/gameweek over the next 5 fixtures",
            sample_size: 5
          )
        ],
        alternatives: [
          RecommendationContract::Alternative.new(
            option: { player_out: { player_id: 101, name: "Declan Rice" },
                      player_in: { player_id: 154, name: "Cole Palmer" } },
            reasoning: [
              RecommendationContract::ReasoningFactor.new(
                factor: "ownership",
                detail: "Lower effective ownership, higher differential upside",
                sample_size: 6
              )
            ],
            why_not_top_pick: "Lower ceiling than the top pick over a full run of fixtures"
          )
        ]
      )

      expect(contract.recommendation[:option][:player_out]).to eq(player_id: 101, name: "Declan Rice")
      expect(contract.recommendation[:option][:player_in]).to eq(player_id: 302, name: "Erling Haaland")
      expect(contract.confidence).to eq("medium")
      expect(contract.reasoning.first.sample_size).to eq(5)

      alternative = contract.alternatives.first
      expect(alternative.option[:player_in]).to eq(player_id: 154, name: "Cole Palmer")
      expect(alternative.why_not_top_pick).to eq("Lower ceiling than the top pick over a full run of fixtures")
    end
  end
end
