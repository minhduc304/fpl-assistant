require "rails_helper"

def team_summary(team_id:, name: "Fantasy Wanderers", manager_name: "A. Manager",
                 overall_rank: 154032, total_points: 412, data_as_of: nil, stale: false)
  TeamSummary::Team.new(
    team_id: team_id, name: name, manager_name: manager_name,
    overall_rank: overall_rank, total_points: total_points,
    data_as_of: data_as_of, stale: stale
  )
end

RSpec.describe "GET /teams/:team_id", type: :request do
  it "returns 200 with a Team-shaped body" do
    allow(TeamSummary).to receive(:for).with(team_id: "1234567")
      .and_return(team_summary(team_id: 1234567))

    get "/teams/1234567"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body).to eq(
      "team_id" => 1234567, "name" => "Fantasy Wanderers",
      "manager_name" => "A. Manager", "overall_rank" => 154032,
      "total_points" => 412, "stale" => false
    )
    assert_response_schema_confirm(200)
  end

  it "returns 404 when FplClient::NotFoundError propagates" do
    allow(TeamSummary).to receive(:for).and_raise(FplClient::NotFoundError)

    get "/teams/999999999"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(TeamSummary).to receive(:for).and_raise(FplClient::UnavailableError)

    get "/teams/1234567"

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end
end

RSpec.describe "GET /teams/:team_id/compare/:rival_team_id", type: :request do
  it "returns 200 with both teams side by side" do
    allow(TeamSummary).to receive(:for).with(team_id: "1234567")
      .and_return(team_summary(team_id: 1234567))
    allow(TeamSummary).to receive(:for).with(team_id: "7654321")
      .and_return(team_summary(team_id: 7654321, name: "Rival FC", manager_name: "B. Rival",
                               overall_rank: 201044, total_points: 398))

    get "/teams/1234567/compare/7654321"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["team"]["team_id"]).to eq(1234567)
    expect(body["rival_team"]["team_id"]).to eq(7654321)
    expect(body["rival_team"]["manager_name"]).to eq("B. Rival")
    expect(body["stale"]).to be(false)
    expect(body).not_to have_key("data_as_of")
    assert_response_schema_confirm(200)
  end

  it "returns 200 with stale + data_as_of (newer timestamp) when a fetch is stale" do
    older = "2026-09-05T09:00:00Z"
    newer = "2026-09-06T09:00:00Z"
    allow(TeamSummary).to receive(:for).with(team_id: "1234567")
      .and_return(team_summary(team_id: 1234567, data_as_of: older, stale: true))
    allow(TeamSummary).to receive(:for).with(team_id: "7654321")
      .and_return(team_summary(team_id: 7654321, data_as_of: newer, stale: true))

    get "/teams/1234567/compare/7654321"

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["stale"]).to be(true)
    expect(body["data_as_of"]).to eq(newer)
    assert_response_schema_confirm(200)
  end

  it "returns 404 when the first team id is unknown" do
    allow(TeamSummary).to receive(:for).with(team_id: "999999999")
      .and_raise(FplClient::NotFoundError)
    allow(TeamSummary).to receive(:for).with(team_id: "7654321")
      .and_return(team_summary(team_id: 7654321))

    get "/teams/999999999/compare/7654321"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 404 when the rival team id is unknown" do
    allow(TeamSummary).to receive(:for).with(team_id: "1234567")
      .and_return(team_summary(team_id: 1234567))
    allow(TeamSummary).to receive(:for).with(team_id: "999999999")
      .and_raise(FplClient::NotFoundError)

    get "/teams/1234567/compare/999999999"

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(TeamSummary).to receive(:for).and_raise(FplClient::UnavailableError)

    get "/teams/1234567/compare/7654321"

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end
end
