require "rails_helper"

RSpec.describe "GET /mini-leagues/:league_id/standings", type: :request do
  def standings(data_as_of: nil, stale: false)
    MiniLeagueStandings::Standings.new(
      league_id: 987654,
      league_name: "Office League",
      entries: [
        MiniLeagueStandings::Entry.new(rank: 1, team_id: 1_234_567, team_name: "Fantasy Wanderers", total_points: 412),
        MiniLeagueStandings::Entry.new(rank: 2, team_id: 7_654_321, team_name: "Rival FC", total_points: 398)
      ],
      data_as_of: data_as_of,
      stale: stale
    )
  end

  it "returns 200 with a standings-shaped body" do
    allow(MiniLeagueStandings).to receive(:for).with(league_id: "987654").and_return(standings)

    get "/mini-leagues/987654/standings"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["league_id"]).to eq(987654)
    expect(body["league_name"]).to eq("Office League")
    expect(body["stale"]).to be(false)
    expect(body).not_to have_key("data_as_of")
    expect(body["standings"].first).to eq(
      "rank" => 1, "team_id" => 1_234_567, "team_name" => "Fantasy Wanderers", "total_points" => 412
    )
    assert_response_schema_confirm(200)
  end

  it "includes data_as_of when standings are stale" do
    allow(MiniLeagueStandings).to receive(:for)
      .and_return(standings(data_as_of: "2026-09-06T09:00:00Z", stale: true))

    get "/mini-leagues/987654/standings"

    body = JSON.parse(response.body)
    expect(body["data_as_of"]).to eq("2026-09-06T09:00:00Z")
    expect(body["stale"]).to be(true)
    assert_response_schema_confirm(200)
  end

  it "returns 404 when FplClient::NotFoundError propagates" do
    allow(MiniLeagueStandings).to receive(:for).and_raise(FplClient::NotFoundError)

    get "/mini-leagues/999999999/standings"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That league ID doesn't exist or isn't public")
    assert_response_schema_confirm(404)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(MiniLeagueStandings).to receive(:for).and_raise(FplClient::UnavailableError)

    get "/mini-leagues/987654/standings"

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end
end
