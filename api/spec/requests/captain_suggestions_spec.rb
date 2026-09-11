require "rails_helper"

RSpec.describe "GET /teams/:team_id/suggest-captain", type: :request do
  let(:recommendation_hash) do
    {
      recommendation: { player_id: 302, name: "M. Salah" },
      confidence: "high",
      reasoning: [
        { factor: "recent_form", detail: "Averaging 8.0 points per game", sample_size: 6 },
        { factor: "fixture_difficulty", detail: "Next fixture rated 2/5 difficulty", sample_size: 1 }
      ],
      alternatives: [
        {
          option: { player_id: 401, name: "E. Haaland" },
          reasoning: [
            { factor: "recent_form", detail: "Averaging 9.0 points per game", sample_size: 6 }
          ],
          why_not_top_pick: "Lower score (1.8 vs 6.4)"
        }
      ],
      data_as_of: nil
    }
  end

  before do
    allow(FplClient).to receive(:entry).and_return(
      FplClient::Result.new(payload: { "id" => 1234567 }, stale: false, fetched_at: Time.current)
    )
  end

  it "returns 200 with a RecommendationContract-shaped body" do
    allow(RecommendationBuilder).to receive(:suggest_captain).and_return(recommendation_hash)

    get "/teams/1234567/suggest-captain"

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["recommendation"]).to eq("player_id" => 302, "name" => "M. Salah")
    assert_response_schema_confirm(200)
  end

  it "returns 503 with a DegradedState body when FplClient::UnavailableError propagates" do
    allow(RecommendationBuilder).to receive(:suggest_captain).and_raise(FplClient::UnavailableError, "no data")

    get "/teams/1234567/suggest-captain"

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end

  it "returns 404 for a syntactically invalid team_id" do
    get "/teams/not-a-team-id/suggest-captain"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 404 for a valid-format but nonexistent team id (FplClient::NotFoundError)" do
    allow(FplClient).to receive(:entry).and_raise(FplClient::NotFoundError)

    get "/teams/999999999/suggest-captain"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end
end
