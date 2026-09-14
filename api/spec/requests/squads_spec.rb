require "rails_helper"

RSpec.describe "GET /teams/:team_id/squad", type: :request do
  let(:squad) do
    SquadAssembler::Squad.new(
      picks: (1..15).map do |i|
        SquadAssembler::Pick.new(
          player_id: i,
          name: "Player#{i}",
          position: %w[GKP DEF MID FWD][i % 4],
          is_captain: i == 1,
          is_vice_captain: i == 2,
          now_cost: 40 + i,
          element_type: (i % 4) + 1,
          starting: i <= 11
        )
      end,
      formation: "3-4-3",
      bank: 12,
      current_event: 4,
      data_as_of: nil,
      stale: false
    )
  end

  it "returns 200 with a Squad-shaped body" do
    allow(SquadAssembler).to receive(:for).with(team_id: "1234567").and_return(squad)

    get "/teams/1234567/squad"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["formation"]).to eq("3-4-3")
    expect(body["picks"].size).to eq(15)
    expect(body["picks"].first).to eq(
      "player_id" => 1, "name" => "Player1", "position" => "DEF",
      "is_captain" => true, "is_vice_captain" => false, "is_starting" => true
    )
    assert_response_schema_confirm(200)
  end

  it "returns 404 when FplClient::NotFoundError propagates" do
    allow(SquadAssembler).to receive(:for).and_raise(FplClient::NotFoundError)

    get "/teams/999999999/squad"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(SquadAssembler).to receive(:for).and_raise(FplClient::UnavailableError)

    get "/teams/1234567/squad"

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end
end
