require "rails_helper"

RSpec.describe "GET /fixtures", type: :request do
  let(:result) do
    FixtureBoard::Result.new(
      fixtures: [
        FixtureBoard::Fixture.new(
          gameweek: 7, home_team: "Liverpool", away_team: "Everton",
          difficulty_home: 2, difficulty_away: 4,
          is_double_gameweek: false, is_blank_gameweek: false
        ),
        FixtureBoard::Fixture.new(
          gameweek: 18, home_team: "Man City", away_team: nil,
          difficulty_home: nil, difficulty_away: nil,
          is_double_gameweek: false, is_blank_gameweek: true
        )
      ],
      data_as_of: nil,
      stale: false
    )
  end

  it "returns 200 with a Fixture-shaped body" do
    allow(FixtureBoard).to receive(:list).with(gameweek: nil, team_id: nil).and_return(result)

    get "/fixtures"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["fixtures"].size).to eq(2)
    expect(body["fixtures"].first).to eq(
      "gameweek" => 7, "home_team" => "Liverpool", "away_team" => "Everton",
      "difficulty_home" => 2, "difficulty_away" => 4,
      "is_double_gameweek" => false, "is_blank_gameweek" => false
    )
    expect(body["stale"]).to be(false)
    assert_response_schema_confirm(200)
  end

  it "passes the gameweek and teamId params through to FixtureBoard" do
    allow(FixtureBoard).to receive(:list).with(gameweek: 7, team_id: 42).and_return(result)

    get "/fixtures", params: { gameweek: "7", teamId: "42" }

    expect(response).to have_http_status(:ok)
    expect(FixtureBoard).to have_received(:list).with(gameweek: 7, team_id: 42)
    assert_response_schema_confirm(200)
  end

  it "ignores non-numeric filter params" do
    allow(FixtureBoard).to receive(:list).with(gameweek: nil, team_id: nil).and_return(result)

    get "/fixtures", params: { gameweek: "soon", teamId: "" }

    expect(response).to have_http_status(:ok)
    expect(FixtureBoard).to have_received(:list).with(gameweek: nil, team_id: nil)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(FixtureBoard).to receive(:list).and_raise(FplClient::UnavailableError)

    get "/fixtures"

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end
end
