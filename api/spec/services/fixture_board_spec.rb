require "rails_helper"

RSpec.describe FixtureBoard do
  def default_teams
    [
      { "id" => 1, "name" => "Liverpool", "short_name" => "LIV" },
      { "id" => 2, "name" => "Everton", "short_name" => "EVE" },
      { "id" => 3, "name" => "Arsenal", "short_name" => "ARS" },
      { "id" => 4, "name" => "Chelsea", "short_name" => "CHE" },
      { "id" => 5, "name" => "Spurs", "short_name" => "TOT" },
      { "id" => 6, "name" => "Fulham", "short_name" => "FUL" }
    ]
  end

  # event 10: every club (that plays) plays once -> normal rows.
  # event 20: club 1 plays twice (DGW); club 4 v 5 is two single clubs (stays
  #           false); club 6 has no fixture (BGW).
  # the null-event fixture must be dropped.
  def default_fixtures
    [
      { "id" => 1, "event" => 10, "team_h" => 1, "team_a" => 2,
        "team_h_difficulty" => 2, "team_a_difficulty" => 4, "finished" => false },
      { "id" => 2, "event" => 10, "team_h" => 3, "team_a" => 4,
        "team_h_difficulty" => 3, "team_a_difficulty" => 3, "finished" => true },
      { "id" => 7, "event" => 10, "team_h" => 5, "team_a" => 6,
        "team_h_difficulty" => 3, "team_a_difficulty" => 3, "finished" => false },
      { "id" => 3, "event" => 20, "team_h" => 1, "team_a" => 2,
        "team_h_difficulty" => 2, "team_a_difficulty" => 5, "finished" => false },
      { "id" => 4, "event" => 20, "team_h" => 3, "team_a" => 1,
        "team_h_difficulty" => 4, "team_a_difficulty" => 2, "finished" => false },
      { "id" => 5, "event" => 20, "team_h" => 4, "team_a" => 5,
        "team_h_difficulty" => 3, "team_a_difficulty" => 3, "finished" => false },
      { "id" => 6, "event" => nil, "team_h" => 5, "team_a" => 6,
        "team_h_difficulty" => 3, "team_a_difficulty" => 3, "finished" => false }
    ]
  end

  def fixtures_result(payload: default_fixtures, stale: false, fetched_at: Time.current)
    FplClient::Result.new(payload: payload, stale: stale, fetched_at: fetched_at)
  end

  def bootstrap_result(teams: default_teams, stale: false, fetched_at: Time.current)
    FplClient::Result.new(payload: { "teams" => teams }, stale: stale, fetched_at: fetched_at)
  end

  before do
    allow(FplClient).to receive(:fixtures).and_return(fixtures_result)
    allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result)
  end

  it "resolves club names and preserves difficulty for a normal fixture" do
    row = FixtureBoard.list.fixtures.find { |f| f.gameweek == 10 && f.home_team == "Liverpool" }

    expect(row).to have_attributes(
      away_team: "Everton", difficulty_home: 2, difficulty_away: 4,
      is_double_gameweek: false, is_blank_gameweek: false
    )
  end

  it "drops fixtures with a null event" do
    expect(FixtureBoard.list.fixtures.map(&:gameweek)).to all(be_in([ 10, 20 ]))
  end

  it "flags is_double_gameweek only on fixtures involving the DGW club" do
    event20 = FixtureBoard.list.fixtures.select { |f| f.gameweek == 20 && !f.is_blank_gameweek }

    liverpool_games = event20.select { |f| [ f.home_team, f.away_team ].include?("Liverpool") }
    two_singles = event20.find { |f| f.home_team == "Chelsea" && f.away_team == "Spurs" }

    expect(liverpool_games.size).to eq(2)
    expect(liverpool_games).to all(have_attributes(is_double_gameweek: true))
    expect(two_singles.is_double_gameweek).to be(false)
  end

  it "emits one synthetic blank row for a club absent from an active event" do
    blanks = FixtureBoard.list.fixtures.select(&:is_blank_gameweek)

    expect(blanks.map { |f| [ f.gameweek, f.home_team ] }).to contain_exactly([ 20, "Fulham" ])
    expect(blanks.first).to have_attributes(
      away_team: nil, difficulty_home: nil, difficulty_away: nil, is_double_gameweek: false
    )
  end

  it "applies the gameweek filter after detection" do
    expect(FixtureBoard.list(gameweek: 10).fixtures.map(&:gameweek).uniq).to eq([ 10 ])
  end

  it "applies the team_id filter (fixtures involving that club, blanks belong to their club)" do
    rows = FixtureBoard.list(team_id: 1).fixtures

    expect(rows).to all(satisfy { |f| [ f.home_team, f.away_team ].include?("Liverpool") })
    expect(rows.size).to eq(3)
  end

  it "surfaces staleness as data_as_of when a source is stale" do
    at = Time.utc(2026, 9, 6, 9, 0, 0)
    allow(FplClient).to receive(:fixtures).and_return(fixtures_result(stale: true, fetched_at: at))

    result = FixtureBoard.list

    expect(result.stale).to be(true)
    expect(result.data_as_of).to eq(at.iso8601)
  end

  it "returns data_as_of nil when nothing is stale" do
    result = FixtureBoard.list

    expect(result.stale).to be(false)
    expect(result.data_as_of).to be_nil
  end

  it "lets FplClient::UnavailableError propagate" do
    allow(FplClient).to receive(:fixtures).and_raise(FplClient::UnavailableError)

    expect { FixtureBoard.list }.to raise_error(FplClient::UnavailableError)
  end
end
