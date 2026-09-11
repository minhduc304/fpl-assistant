require "rails_helper"

RSpec.describe PlayerCatalog do
  def default_teams
    [
      { "id" => 1, "name" => "Liverpool", "short_name" => "LIV" },
      { "id" => 2, "name" => "Arsenal", "short_name" => "ARS" }
    ]
  end

  def default_element_types
    [
      { "id" => 1, "singular_name_short" => "GKP" },
      { "id" => 2, "singular_name_short" => "DEF" },
      { "id" => 3, "singular_name_short" => "MID" },
      { "id" => 4, "singular_name_short" => "FWD" }
    ]
  end

  def default_elements
    [
      { "id" => 1, "web_name" => "Alisson", "first_name" => "Alisson", "second_name" => "Becker",
        "team" => 1, "element_type" => 1, "now_cost" => 55, "total_points" => 40, "form" => "3.2",
        "selected_by_percent" => "12.1" },
      { "id" => 2, "web_name" => "Salah", "first_name" => "Mohamed", "second_name" => "Salah",
        "team" => 1, "element_type" => 3, "now_cost" => 128, "total_points" => 90, "form" => "6.4",
        "selected_by_percent" => "45.0" },
      { "id" => 3, "web_name" => "Saka", "first_name" => "Bukayo", "second_name" => "Saka",
        "team" => 2, "element_type" => 3, "now_cost" => 100, "total_points" => 70, "form" => "5.1",
        "selected_by_percent" => "30.0" },
      { "id" => 4, "web_name" => "Saliba", "first_name" => "William", "second_name" => "Saliba",
        "team" => 2, "element_type" => 2, "now_cost" => 60, "total_points" => 50, "form" => "4.0",
        "selected_by_percent" => "20.0" }
    ]
  end

  def bootstrap_result(elements: default_elements, teams: default_teams,
                       element_types: default_element_types, stale: false, fetched_at: Time.current)
    FplClient::Result.new(
      payload: { "elements" => elements, "teams" => teams, "element_types" => element_types },
      stale: stale, fetched_at: fetched_at
    )
  end

  before do
    allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result)
  end

  describe ".find" do
    it "returns a Player struct with derived fields" do
      player = described_class.find(2)

      expect(player.player_id).to eq(2)
      expect(player.name).to eq("Salah")
      expect(player.team).to eq("Liverpool")
      expect(player.position).to eq("MID")
      expect(player.price).to eq(12.8)
      expect(player.total_points).to eq(90)
      expect(player.form).to eq(6.4)
    end

    it "raises NotFoundError for an unknown id" do
      expect { described_class.find(999) }.to raise_error(PlayerCatalog::NotFoundError)
    end
  end

  describe ".search" do
    it "returns all players when every filter is nil" do
      expect(described_class.search.players.map(&:player_id)).to contain_exactly(1, 2, 3, 4)
    end

    it "filters by case-insensitive query against web_name and full name" do
      expect(described_class.search(query: "sal").players.map(&:name)).to contain_exactly("Salah", "Saliba")
      expect(described_class.search(query: "bukayo").players.map(&:name)).to eq(["Saka"])
    end

    it "filters by position short name (case-insensitive)" do
      expect(described_class.search(position: "mid").players.map(&:name)).to contain_exactly("Salah", "Saka")
    end

    it "ignores an unrecognized position value" do
      expect(described_class.search(position: "MIDFIELDER").players.map(&:player_id)).to contain_exactly(1, 2, 3, 4)
    end

    it "filters by team name or short_name (case-insensitive)" do
      expect(described_class.search(team: "arsenal").players.map(&:name)).to contain_exactly("Saka", "Saliba")
      expect(described_class.search(team: "liv").players.map(&:name)).to contain_exactly("Alisson", "Salah")
    end

    it "combines filters with AND" do
      result = described_class.search(query: "sal", position: "MID", team: "Liverpool")
      expect(result.players.map(&:name)).to eq(["Salah"])
    end
  end

  describe ".by_ids" do
    it "returns found players in input order and skips unknown ids" do
      result = described_class.by_ids([3, 999, 1])
      expect(result.players.map(&:player_id)).to eq([3, 1])
    end
  end

  describe "derivation" do
    it "resolves position from element_types, not a hardcoded map" do
      weird = default_element_types.map { |t| t["id"] == 3 ? t.merge("singular_name_short" => "MID") : t }
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(element_types: weird))
      expect(described_class.find(2).position).to eq("MID")
    end

    it "computes price as now_cost / 10" do
      expect(described_class.find(1).price).to eq(5.5)
    end
  end

  describe "staleness" do
    it "populates data_as_of and stale on a stale Result" do
      stale_time = 2.hours.ago
      allow(FplClient).to receive(:bootstrap_static)
        .and_return(bootstrap_result(stale: true, fetched_at: stale_time))

      result = described_class.search
      expect(result.stale).to be(true)
      expect(result.data_as_of).to eq(stale_time.iso8601)
      expect(result.players.first.stale).to be(true)
      expect(result.players.first.data_as_of).to eq(stale_time.iso8601)
    end

    it "leaves data_as_of nil and stale false when fresh" do
      result = described_class.by_ids([1])
      expect(result.stale).to be(false)
      expect(result.data_as_of).to be_nil
    end
  end

  it "propagates FplClient::UnavailableError unchanged" do
    allow(FplClient).to receive(:bootstrap_static).and_raise(FplClient::UnavailableError)
    expect { described_class.search }.to raise_error(FplClient::UnavailableError)
  end
end
