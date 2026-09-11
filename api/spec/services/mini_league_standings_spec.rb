require "rails_helper"

RSpec.describe MiniLeagueStandings do
  def standings_payload(overrides = {})
    {
      "league" => { "id" => 987, "name" => "Office League" },
      "standings" => {
        "has_next" => false,
        "page" => 1,
        "results" => [
          { "entry" => 1_234_567, "entry_name" => "Fantasy Wanderers", "rank" => 1, "total" => 412 },
          { "entry" => 7_654_321, "entry_name" => "Rival FC", "rank" => 2, "total" => 398 }
        ]
      }
    }.merge(overrides)
  end

  def standings_result(payload: standings_payload, stale: false, fetched_at: Time.current)
    FplClient::Result.new(payload: payload, stale: stale, fetched_at: fetched_at)
  end

  it "maps league id/name and every entry field" do
    allow(FplClient).to receive(:league_standings).with(987).and_return(standings_result)

    result = described_class.for(league_id: 987)

    expect(result.league_id).to eq(987)
    expect(result.league_name).to eq("Office League")
    expect(result.stale).to be(false)
    expect(result.data_as_of).to be_nil
    expect(result.entries.map(&:to_h)).to eq(
      [
        { rank: 1, team_id: 1_234_567, team_name: "Fantasy Wanderers", total_points: 412 },
        { rank: 2, team_id: 7_654_321, team_name: "Rival FC", total_points: 398 }
      ]
    )
  end

  it "falls back to the passed league_id when the payload has no league id" do
    allow(FplClient).to receive(:league_standings)
      .and_return(standings_result(payload: standings_payload("league" => { "name" => "X" })))

    expect(described_class.for(league_id: "42").league_id).to eq(42)
  end

  it "exposes data_as_of (iso8601) and stale: true from a stale Result" do
    stale_time = 2.hours.ago
    allow(FplClient).to receive(:league_standings)
      .and_return(standings_result(stale: true, fetched_at: stale_time))

    result = described_class.for(league_id: 987)

    expect(result.stale).to be(true)
    expect(result.data_as_of).to eq(stale_time.iso8601)
  end

  it "propagates FplClient::NotFoundError unchanged" do
    allow(FplClient).to receive(:league_standings).and_raise(FplClient::NotFoundError)
    expect { described_class.for(league_id: 999) }.to raise_error(FplClient::NotFoundError)
  end

  it "propagates FplClient::UnavailableError unchanged" do
    allow(FplClient).to receive(:league_standings).and_raise(FplClient::UnavailableError)
    expect { described_class.for(league_id: 999) }.to raise_error(FplClient::UnavailableError)
  end
end
