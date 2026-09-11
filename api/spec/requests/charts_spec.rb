require "rails_helper"

RSpec.describe "GET /teams/:team_id/charts", type: :request do
  def series(type:, data_as_of: nil, stale: false)
    ChartSeries::Series.new(
      type: type,
      points: [{ x: 1, y: 62 }, { x: 2, y: 78 }],
      data_as_of: data_as_of,
      stale: stale
    )
  end

  %w[points_per_gameweek rank_trajectory price_history].each do |type|
    it "returns 200 with a ChartData-shaped body for type=#{type}" do
      allow(ChartSeries).to receive(:for)
        .with(team_id: "1234567", type: type)
        .and_return(series(type: type))

      get "/teams/1234567/charts", params: { type: type }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["type"]).to eq(type)
      expect(body["points"]).to eq([{ "x" => 1, "y" => 62 }, { "x" => 2, "y" => 78 }])
      expect(body["stale"]).to be(false)
      expect(body).not_to have_key("data_as_of")
      assert_response_schema_confirm(200)
    end
  end

  it "includes data_as_of when the series is stale" do
    allow(ChartSeries).to receive(:for)
      .and_return(series(type: "points_per_gameweek", data_as_of: "2026-09-06T09:00:00Z", stale: true))

    get "/teams/1234567/charts", params: { type: "points_per_gameweek" }

    body = JSON.parse(response.body)
    expect(body["data_as_of"]).to eq("2026-09-06T09:00:00Z")
    expect(body["stale"]).to be(true)
    assert_response_schema_confirm(200)
  end

  it "returns 400 when type is missing" do
    get "/teams/1234567/charts"

    expect(response).to have_http_status(:bad_request)
    expect(JSON.parse(response.body)).to eq(
      "message" => "type must be one of: points_per_gameweek, rank_trajectory, price_history"
    )
    assert_response_schema_confirm(400)
  end

  it "returns 400 when type is not in the enum" do
    get "/teams/1234567/charts", params: { type: "nonsense" }

    expect(response).to have_http_status(:bad_request)
    assert_response_schema_confirm(400)
  end

  it "returns 404 when FplClient::NotFoundError propagates" do
    allow(ChartSeries).to receive(:for).and_raise(FplClient::NotFoundError)

    get "/teams/999999999/charts", params: { type: "points_per_gameweek" }

    expect(response).to have_http_status(:not_found)
    expect(JSON.parse(response.body)).to eq("message" => "That team ID doesn't exist")
    assert_response_schema_confirm(404)
  end

  it "returns 503 when FplClient::UnavailableError propagates" do
    allow(ChartSeries).to receive(:for).and_raise(FplClient::UnavailableError)

    get "/teams/1234567/charts", params: { type: "points_per_gameweek" }

    expect(response).to have_http_status(:service_unavailable)
    expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
    assert_response_schema_confirm(503)
  end
end
