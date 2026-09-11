require "rails_helper"

RSpec.describe "GET /teams/:team_id/suggest-transfer", type: :request do
  let(:recommendation_hash) do
    {
      recommendation: {
        player_out: { player_id: 210, name: "J. Struggling" },
        player_in: { player_id: 415, name: "B. Differential" }
      },
      confidence: "medium",
      reasoning: [
        { factor: "recent_form", detail: "player_in averaging 5.80 points per game", sample_size: 6 },
        { factor: "expected_gain", detail: "Projected points gain of 3.40 over the current pick", sample_size: 1 }
      ],
      alternatives: [
        {
          option: {
            player_out: { player_id: 210, name: "J. Struggling" },
            player_in: { player_id: 322, name: "C. Template" }
          },
          reasoning: [
            { factor: "expected_gain", detail: "Projected points gain of 1.20 over the current pick", sample_size: 1 }
          ],
          why_not_top_pick: "Lower projected gain (1.20 vs 3.40)"
        }
      ],
      data_as_of: nil
    }
  end

  it "returns 200 with a RecommendationContract-shaped body (default balanced)" do
    allow(RecommendationBuilder).to receive(:suggest_transfer)
      .with(team_id: "1234567", risk_tolerance: "balanced")
      .and_return(recommendation_hash)

    get "/teams/1234567/suggest-transfer"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["recommendation"]["player_out"]["player_id"]).to eq(210)
    expect(body["recommendation"]["player_in"]["player_id"]).to eq(415)
    assert_response_schema_confirm(200)
  end

  %w[safe balanced differential].each do |risk|
    it "passes risk_tolerance=#{risk} through and returns 200" do
      allow(RecommendationBuilder).to receive(:suggest_transfer)
        .with(team_id: "1234567", risk_tolerance: risk)
        .and_return(recommendation_hash)

      get "/teams/1234567/suggest-transfer", params: { risk_tolerance: risk }

      expect(response).to have_http_status(:ok)
      assert_response_schema_confirm(200)
    end
  end

  it "coerces an out-of-enum risk_tolerance to balanced" do
    allow(RecommendationBuilder).to receive(:suggest_transfer)
      .with(team_id: "1234567", risk_tolerance: "balanced")
      .and_return(recommendation_hash)

    get "/teams/1234567/suggest-transfer", params: { risk_tolerance: "reckless" }

    expect(response).to have_http_status(:ok)
  end

  it "returns 404 when FplClient::NotFoundError propagates" do
    allow(RecommendationBuilder).to receive(:suggest_transfer).and_raise(FplClient::NotFoundError)

    get "/teams/999999999/suggest-transfer"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(RecommendationBuilder).to receive(:suggest_transfer).and_raise(FplClient::UnavailableError)

    get "/teams/1234567/suggest-transfer"

    expect(response).to have_http_status(:service_unavailable)
    assert_response_schema_confirm(503)
  end

  it "returns 503 when no fieldable transfer candidate exists" do
    allow(RecommendationBuilder).to receive(:suggest_transfer)
      .and_raise(RecommendationBuilder::NoTransferCandidateError)

    get "/teams/1234567/suggest-transfer"

    expect(response).to have_http_status(:service_unavailable)
    assert_response_schema_confirm(503)
  end
end
