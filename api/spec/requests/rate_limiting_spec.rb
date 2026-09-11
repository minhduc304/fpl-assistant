require "rails_helper"

# BL-007 / Task 40: inbound rate limiting (rack-attack).
#
# Rack::Attack.enabled is false in the test env by default (see
# config/initializers/rack_attack.rb), so every other request spec is
# unaffected. This spec opts in and gives rack-attack a real cache store,
# because Rails.cache is :null_store in test and throttle counts would never
# persist.
RSpec.describe "Inbound rate limiting", type: :request do
  limit = Rack::Attack::RATE_LIMIT_PER_MINUTE

  before do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    Rack::Attack.reset!
  end

  after do
    Rack::Attack.enabled = false
    Rack::Attack.cache.store = Rails.cache
    Rack::Attack.reset!
  end

  it "throttles a documented endpoint at the limit and returns a contract-matching 429" do
    allow(PlayerCatalog).to receive(:find).with("302").and_return(
      PlayerCatalog::Player.new(
        player_id: 302, name: "M. Salah", team: "Liverpool", position: "MID",
        price: 12.8, total_points: 68, form: 6.4, data_as_of: nil, stale: false
      )
    )

    limit.times do
      get "/players/302"
      expect(response).to have_http_status(:ok)
    end

    get "/players/302"

    expect(response.status).to eq(429)
    expect(response.headers["Retry-After"]).to match(/\A\d+\z/)
    expect(JSON.parse(response.body)).to eq("message" => "Rate limit exceeded, please retry shortly")
    assert_response_schema_confirm(429)
  end

  it "throttles the /up health route too (all requests are covered)" do
    limit.times { get "/up" }

    get "/up"

    expect(response.status).to eq(429)
    expect(response.headers["Retry-After"]).to match(/\A\d+\z/)
  end
end
