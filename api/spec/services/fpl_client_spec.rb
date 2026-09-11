require "rails_helper"
require "webmock/rspec"

RSpec.describe FplClient do
  let(:fixtures_url) { "https://fantasy.premierleague.com/api/fixtures/" }
  let(:bootstrap_url) { "https://fantasy.premierleague.com/api/bootstrap-static/" }

  def bootstrap_payload(events:)
    { "events" => events }
  end

  def live_event
    { "id" => 1, "deadline_time" => 1.hour.ago.iso8601, "finished" => false }
  end

  def finished_event
    { "id" => 1, "deadline_time" => 1.hour.ago.iso8601, "finished" => true }
  end

  def upcoming_event
    { "id" => 2, "deadline_time" => 1.hour.from_now.iso8601, "finished" => false }
  end

  before do
    WebMock.disable_net_connect!
  end

  describe "cache hit within TTL" do
    it "returns the cached payload and makes no HTTP call" do
      cached_payload = { "fixtures" => "cached" }
      ApiCache.create!(resource: "fixtures", payload: cached_payload, fetched_at: 10.minutes.ago)

      result = FplClient.fixtures

      expect(result.payload).to eq(cached_payload)
      expect(result.stale?).to eq(false)
      expect(WebMock).not_to have_requested(:get, fixtures_url)
    end
  end

  describe "cache miss" do
    it "makes a real HTTP call and caches the result" do
      fresh_payload = { "fixtures" => "fresh" }
      stub_request(:get, fixtures_url).to_return(status: 200, body: fresh_payload.to_json)

      result = FplClient.fixtures

      expect(result.payload).to eq(fresh_payload)
      expect(result.stale?).to eq(false)
      expect(WebMock).to have_requested(:get, fixtures_url).once

      row = ApiCache.find_by(resource: "fixtures")
      expect(row.payload).to eq(fresh_payload)
      expect(row.fetched_at).to be_present
    end
  end

  describe "TTL detection" do
    it "treats a 10-minute-old fixtures cache as expired during a live gameweek (5 min TTL)" do
      ApiCache.create!(resource: "bootstrap-static", payload: bootstrap_payload(events: [ live_event ]), fetched_at: 1.minute.ago)
      ApiCache.create!(resource: "fixtures", payload: { "fixtures" => "stale-ish" }, fetched_at: 10.minutes.ago)

      fresh_payload = { "fixtures" => "refetched" }
      stub_request(:get, fixtures_url).to_return(status: 200, body: fresh_payload.to_json)

      result = FplClient.fixtures

      expect(WebMock).to have_requested(:get, fixtures_url).once
      expect(result.payload).to eq(fresh_payload)
    end

    it "treats a 10-minute-old fixtures cache as fresh off-peak (30 min TTL)" do
      ApiCache.create!(resource: "bootstrap-static", payload: bootstrap_payload(events: [ finished_event, upcoming_event ]), fetched_at: 1.minute.ago)
      cached_payload = { "fixtures" => "still-fresh" }
      ApiCache.create!(resource: "fixtures", payload: cached_payload, fetched_at: 10.minutes.ago)

      result = FplClient.fixtures

      expect(WebMock).not_to have_requested(:get, fixtures_url)
      expect(result.payload).to eq(cached_payload)
      expect(result.stale?).to eq(false)
    end

    it "defaults to the 30-minute TTL when bootstrap-static isn't cached yet" do
      cached_payload = { "fixtures" => "still-fresh" }
      ApiCache.create!(resource: "fixtures", payload: cached_payload, fetched_at: 10.minutes.ago)

      result = FplClient.fixtures

      expect(WebMock).not_to have_requested(:get, fixtures_url)
      expect(WebMock).not_to have_requested(:get, bootstrap_url)
      expect(result.payload).to eq(cached_payload)
    end
  end

  describe "timeout / backoff / fallback" do
    before do
      allow(FplClient).to receive(:sleep)
    end

    it "attempts exactly 3 times, sleeping 1s then 2s, and serves stale cache when a row exists" do
      stale_payload = { "fixtures" => "old-but-gold" }
      fetched_at = 45.minutes.ago
      ApiCache.create!(resource: "fixtures", payload: stale_payload, fetched_at: fetched_at)
      stub_request(:get, fixtures_url).to_timeout

      result = FplClient.fixtures

      expect(WebMock).to have_requested(:get, fixtures_url).times(3)
      expect(FplClient).to have_received(:sleep).with(1).ordered
      expect(FplClient).to have_received(:sleep).with(2).ordered
      expect(result.stale?).to eq(true)
      expect(result.payload).to eq(stale_payload)
      expect(result.fetched_at).to be_within(1.second).of(fetched_at)
    end

    it "raises a clear degraded-state error (never a raw HTTP exception) when all attempts fail with no cached row" do
      stub_request(:get, fixtures_url).to_timeout

      expect { FplClient.fixtures }.to raise_error(FplClient::UnavailableError)

      expect(WebMock).to have_requested(:get, fixtures_url).times(3)
    end
  end

  describe "entry (parameterized resource)" do
    let(:team_id) { 12345 }
    let(:entry_url) { "https://fantasy.premierleague.com/api/entry/#{team_id}/" }

    it "fetches on cache miss, writes one row keyed entry/<id>, and returns the payload" do
      payload = { "id" => team_id, "name" => "Test FC" }
      stub_request(:get, entry_url).to_return(status: 200, body: payload.to_json)

      result = FplClient.entry(team_id)

      expect(result.payload).to eq(payload)
      expect(result.stale?).to eq(false)
      expect(WebMock).to have_requested(:get, entry_url).once

      rows = ApiCache.where(resource: "entry/#{team_id}")
      expect(rows.count).to eq(1)
      expect(rows.first.payload).to eq(payload)
    end

    it "serves a cache hit within the 6h TTL without a second HTTP call" do
      cached = { "id" => team_id, "name" => "Cached FC" }
      ApiCache.create!(resource: "entry/#{team_id}", payload: cached, fetched_at: 3.hours.ago)

      result = FplClient.entry(team_id)

      expect(result.payload).to eq(cached)
      expect(result.stale?).to eq(false)
      expect(WebMock).not_to have_requested(:get, entry_url)
    end

    it "raises NotFoundError on a 404, makes exactly one request, and writes no cache row" do
      stub_request(:get, entry_url).to_return(status: 404, body: "")

      expect { FplClient.entry(team_id) }.to raise_error(FplClient::NotFoundError)

      expect(WebMock).to have_requested(:get, entry_url).once
      expect(ApiCache.where(resource: "entry/#{team_id}").count).to eq(0)
    end

    it "raises UnavailableError when FPL is unreachable and no cache row exists" do
      allow(FplClient).to receive(:sleep)
      stub_request(:get, entry_url).to_timeout

      expect { FplClient.entry(team_id) }.to raise_error(FplClient::UnavailableError)
      expect(WebMock).to have_requested(:get, entry_url).times(3)
    end

    it "returns a stale Result when FPL is unreachable but a stale cache row exists" do
      allow(FplClient).to receive(:sleep)
      stale = { "id" => team_id, "name" => "Old FC" }
      ApiCache.create!(resource: "entry/#{team_id}", payload: stale, fetched_at: 8.hours.ago)
      stub_request(:get, entry_url).to_timeout

      result = FplClient.entry(team_id)

      expect(result.stale?).to eq(true)
      expect(result.payload).to eq(stale)
    end

    it "treats a 5h-old row as fresh and a 7h-old row as expired" do
      fresh = { "id" => team_id }
      ApiCache.create!(resource: "entry/#{team_id}", payload: fresh, fetched_at: 5.hours.ago)
      result = FplClient.entry(team_id)
      expect(WebMock).not_to have_requested(:get, entry_url)
      expect(result.payload).to eq(fresh)

      ApiCache.find_by(resource: "entry/#{team_id}").update!(fetched_at: 7.hours.ago)
      refetched = { "id" => team_id, "name" => "Refetched" }
      stub_request(:get, entry_url).to_return(status: 200, body: refetched.to_json)

      result = FplClient.entry(team_id)
      expect(WebMock).to have_requested(:get, entry_url).once
      expect(result.payload).to eq(refetched)
    end
  end

  describe "picks (parameterized resource)" do
    let(:team_id) { 999 }

    def picks_url(gw)
      "https://fantasy.premierleague.com/api/entry/#{team_id}/event/#{gw}/picks/"
    end

    it "fetches the gameweek path on cache miss and writes a row keyed entry/<id>/picks" do
      payload = { "picks" => [ { "element" => 1 } ] }
      stub_request(:get, picks_url(5)).to_return(status: 200, body: payload.to_json)

      result = FplClient.picks(team_id, 5)

      expect(result.payload).to eq(payload)
      expect(WebMock).to have_requested(:get, picks_url(5)).once

      rows = ApiCache.where(resource: "entry/#{team_id}/picks")
      expect(rows.count).to eq(1)
      expect(rows.first.payload).to eq(payload)
    end

    it "overwrites the single row on refetch rather than adding one per gameweek" do
      gw5 = { "picks" => [ { "element" => 5 } ] }
      stub_request(:get, picks_url(5)).to_return(status: 200, body: gw5.to_json)
      FplClient.picks(team_id, 5)

      ApiCache.find_by(resource: "entry/#{team_id}/picks").update!(fetched_at: 7.hours.ago)

      gw6 = { "picks" => [ { "element" => 6 } ] }
      stub_request(:get, picks_url(6)).to_return(status: 200, body: gw6.to_json)
      result = FplClient.picks(team_id, 6)

      expect(result.payload).to eq(gw6)
      expect(ApiCache.where("resource LIKE 'entry/%/picks'").count).to eq(1)
    end
  end

  describe "history (parameterized resource)" do
    let(:team_id) { 123 }
    let(:history_url) { "https://fantasy.premierleague.com/api/entry/#{team_id}/history/" }

    it "fetches on cache miss and writes one row keyed entry/<id>/history" do
      payload = { "current" => [ { "event" => 1, "points" => 50 } ] }
      stub_request(:get, history_url).to_return(status: 200, body: payload.to_json)

      result = FplClient.history(team_id)

      expect(result.payload).to eq(payload)
      expect(result.stale?).to eq(false)
      expect(WebMock).to have_requested(:get, history_url).once

      rows = ApiCache.where(resource: "entry/#{team_id}/history")
      expect(rows.count).to eq(1)
      expect(rows.first.payload).to eq(payload)
    end

    it "serves a cache hit within the 6h TTL without a second HTTP call" do
      cached = { "current" => [ { "event" => 1 } ] }
      ApiCache.create!(resource: "entry/#{team_id}/history", payload: cached, fetched_at: 3.hours.ago)

      result = FplClient.history(team_id)

      expect(result.payload).to eq(cached)
      expect(WebMock).not_to have_requested(:get, history_url)
    end

    it "raises NotFoundError on a 404" do
      stub_request(:get, history_url).to_return(status: 404, body: "")

      expect { FplClient.history(team_id) }.to raise_error(FplClient::NotFoundError)
      expect(WebMock).to have_requested(:get, history_url).once
    end

    it "raises UnavailableError when FPL is unreachable and no cache row exists" do
      allow(FplClient).to receive(:sleep)
      stub_request(:get, history_url).to_timeout

      expect { FplClient.history(team_id) }.to raise_error(FplClient::UnavailableError)
      expect(WebMock).to have_requested(:get, history_url).times(3)
    end

    it "returns a stale Result when FPL is unreachable but a stale cache row exists" do
      allow(FplClient).to receive(:sleep)
      stale = { "current" => [ { "event" => 1 } ] }
      ApiCache.create!(resource: "entry/#{team_id}/history", payload: stale, fetched_at: 8.hours.ago)
      stub_request(:get, history_url).to_timeout

      result = FplClient.history(team_id)

      expect(result.stale?).to eq(true)
      expect(result.payload).to eq(stale)
    end
  end

  describe "league_standings (parameterized resource)" do
    let(:league_id) { 987 }
    let(:standings_url) { "https://fantasy.premierleague.com/api/leagues-classic/#{league_id}/standings/" }

    it "fetches on cache miss and writes one row keyed leagues-classic/<id>/standings" do
      payload = { "standings" => { "results" => [ { "entry" => 1 } ] } }
      stub_request(:get, standings_url).to_return(status: 200, body: payload.to_json)

      result = FplClient.league_standings(league_id)

      expect(result.payload).to eq(payload)
      expect(result.stale?).to eq(false)
      expect(WebMock).to have_requested(:get, standings_url).once

      rows = ApiCache.where(resource: "leagues-classic/#{league_id}/standings")
      expect(rows.count).to eq(1)
      expect(rows.first.payload).to eq(payload)
    end

    it "serves a cache hit without a second HTTP call" do
      cached = { "standings" => { "results" => [] } }
      ApiCache.create!(resource: "leagues-classic/#{league_id}/standings", payload: cached, fetched_at: 10.minutes.ago)

      result = FplClient.league_standings(league_id)

      expect(result.payload).to eq(cached)
      expect(WebMock).not_to have_requested(:get, standings_url)
    end

    it "raises NotFoundError on a 404" do
      stub_request(:get, standings_url).to_return(status: 404, body: "")

      expect { FplClient.league_standings(league_id) }.to raise_error(FplClient::NotFoundError)
      expect(WebMock).to have_requested(:get, standings_url).once
    end

    it "maps a 403 (private league) to NotFoundError" do
      stub_request(:get, standings_url).to_return(status: 403, body: "")

      expect { FplClient.league_standings(league_id) }.to raise_error(FplClient::NotFoundError)
      expect(WebMock).to have_requested(:get, standings_url).once
    end

    it "raises UnavailableError when FPL is unreachable and no cache row exists" do
      allow(FplClient).to receive(:sleep)
      stub_request(:get, standings_url).to_timeout

      expect { FplClient.league_standings(league_id) }.to raise_error(FplClient::UnavailableError)
      expect(WebMock).to have_requested(:get, standings_url).times(3)
    end
  end

  describe "recovery after a prior failure" do
    it "updates the cache on a successful fetch that follows earlier failures" do
      old_payload = { "fixtures" => "before" }
      ApiCache.create!(resource: "fixtures", payload: old_payload, fetched_at: 45.minutes.ago)

      stub_request(:get, fixtures_url).to_timeout
      allow(FplClient).to receive(:sleep)

      first_result = FplClient.fixtures
      expect(first_result.stale?).to eq(true)
      expect(first_result.payload).to eq(old_payload)

      new_payload = { "fixtures" => "after" }
      stub_request(:get, fixtures_url).to_return(status: 200, body: new_payload.to_json)

      second_result = FplClient.fixtures

      expect(second_result.stale?).to eq(false)
      expect(second_result.payload).to eq(new_payload)

      row = ApiCache.find_by(resource: "fixtures")
      expect(row.payload).to eq(new_payload)
      expect(row.fetched_at).to be_within(1.minute).of(Time.current)
    end
  end
end
