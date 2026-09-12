require "rails_helper"

RSpec.describe "Player read endpoints", type: :request do
  def player(overrides = {})
    PlayerCatalog::Player.new(
      {
        player_id: 302,
        name: "M. Salah",
        team: "Liverpool",
        position: "MID",
        price: 12.8,
        total_points: 68,
        form: 6.4,
        data_as_of: nil,
        stale: false
      }.merge(overrides)
    )
  end

  def result(players, data_as_of: nil, stale: false)
    PlayerCatalog::Result.new(players: players, data_as_of: data_as_of, stale: stale)
  end

  describe "GET /players/:player_id" do
    it "returns 200 with a Player-shaped body" do
      allow(PlayerCatalog).to receive(:find).with(302).and_return(player)

      get "/players/302"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body).to include(
        "player_id" => 302, "name" => "M. Salah", "team" => "Liverpool",
        "position" => "MID", "price" => 12.8, "total_points" => 68,
        "form" => 6.4, "stale" => false
      )
      expect(body).not_to have_key("data_as_of")
      assert_response_schema_confirm(200)
    end

    it "includes data_as_of when the player result is stale" do
      allow(PlayerCatalog).to receive(:find)
        .and_return(player(data_as_of: "2026-09-06T09:00:00Z", stale: true))

      get "/players/302"

      body = JSON.parse(response.body)
      expect(body["data_as_of"]).to eq("2026-09-06T09:00:00Z")
      expect(body["stale"]).to be(true)
      assert_response_schema_confirm(200)
    end

    it "returns 404 when PlayerCatalog::NotFoundError propagates" do
      allow(PlayerCatalog).to receive(:find).and_raise(PlayerCatalog::NotFoundError)

      get "/players/999999"

      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)).to eq("message" => "That player ID doesn't exist")
      assert_response_schema_confirm(404)
    end

    it "returns 503 when FplClient::UnavailableError propagates" do
      allow(PlayerCatalog).to receive(:find).and_raise(FplClient::UnavailableError)

      get "/players/302"

      expect(response).to have_http_status(:service_unavailable)
      expect(JSON.parse(response.body)).to eq("message" => "live data temporarily unavailable, try again shortly")
      assert_response_schema_confirm(503)
    end
  end

  describe "GET /players" do
    it "returns 200 unfiltered" do
      allow(PlayerCatalog).to receive(:search)
        .with(query: nil, position: nil, team: nil)
        .and_return(result([player, player(player_id: 401, name: "E. Haaland")]))

      get "/players"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["players"].size).to eq(2)
      expect(body["players"].first).to eq(
        "player_id" => 302, "name" => "M. Salah", "team" => "Liverpool",
        "position" => "MID", "price" => 12.8, "total_points" => 68, "form" => 6.4
      )
      expect(body["stale"]).to be(false)
      assert_response_schema_confirm(200)
    end

    it "passes query/position/team through to the service" do
      allow(PlayerCatalog).to receive(:search)
        .with(query: "sal", position: "MID", team: "Liverpool")
        .and_return(result([player]))

      get "/players", params: { query: "sal", position: "MID", team: "Liverpool" }

      expect(response).to have_http_status(:ok)
      expect(PlayerCatalog).to have_received(:search).with(query: "sal", position: "MID", team: "Liverpool")
      assert_response_schema_confirm(200)
    end

    it "returns 200 with an empty result set" do
      allow(PlayerCatalog).to receive(:search).and_return(result([], data_as_of: "2026-09-06T09:00:00Z", stale: true))

      get "/players"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["players"]).to eq([])
      expect(body["data_as_of"]).to eq("2026-09-06T09:00:00Z")
      assert_response_schema_confirm(200)
    end

    it "returns 503 when FplClient::UnavailableError propagates" do
      allow(PlayerCatalog).to receive(:search).and_raise(FplClient::UnavailableError)

      get "/players"

      expect(response).to have_http_status(:service_unavailable)
      assert_response_schema_confirm(503)
    end
  end

  describe "GET /players/compare" do
    it "returns 200 for playerIds=302,401" do
      allow(PlayerCatalog).to receive(:by_ids).with([302, 401])
        .and_return(result([player, player(player_id: 401, name: "E. Haaland", position: "FWD")]))

      get "/players/compare", params: { playerIds: "302,401" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["players"].map { |p| p["player_id"] }).to eq([302, 401])
      assert_response_schema_confirm(200)
    end

    it "returns 400 when only one id is supplied" do
      get "/players/compare", params: { playerIds: "302" }

      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)).to eq("message" => "At least two playerIds are required for comparison")
      assert_response_schema_confirm(400)
    end

    it "returns 400 when playerIds is blank" do
      get "/players/compare", params: { playerIds: "" }

      expect(response).to have_http_status(:bad_request)
      assert_response_schema_confirm(400)
    end

    it "returns 400 when two ids are given but by_ids resolves fewer than two" do
      allow(PlayerCatalog).to receive(:by_ids).with([302, 999999]).and_return(result([player]))

      get "/players/compare", params: { playerIds: "302, 999999" }

      expect(response).to have_http_status(:bad_request)
      assert_response_schema_confirm(400)
    end

    it "returns 503 when FplClient::UnavailableError propagates" do
      allow(PlayerCatalog).to receive(:by_ids).and_raise(FplClient::UnavailableError)

      get "/players/compare", params: { playerIds: "302,401" }

      expect(response).to have_http_status(:service_unavailable)
      assert_response_schema_confirm(503)
    end
  end
end
