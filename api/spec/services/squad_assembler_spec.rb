require "rails_helper"

RSpec.describe SquadAssembler do
  def default_element_types
    [
      { "id" => 1, "singular_name_short" => "GKP" },
      { "id" => 2, "singular_name_short" => "DEF" },
      { "id" => 3, "singular_name_short" => "MID" },
      { "id" => 4, "singular_name_short" => "FWD" }
    ]
  end

  # ~20 bootstrap elements: ids 1-2 GKP, 3-9 DEF, 10-16 MID, 17-20 FWD.
  def bootstrap_elements
    types = { 1 => 1, 2 => 1, 3 => 2, 4 => 2, 5 => 2, 6 => 2, 7 => 2, 8 => 2, 9 => 2,
              10 => 3, 11 => 3, 12 => 3, 13 => 3, 14 => 3, 15 => 3, 16 => 3,
              17 => 4, 18 => 4, 19 => 4, 20 => 4 }
    types.map do |id, element_type|
      { "id" => id, "web_name" => "Player#{id}", "element_type" => element_type,
        "now_cost" => 40 + id, "team" => 1 }
    end
  end

  def bootstrap_result(elements: bootstrap_elements, element_types: default_element_types, stale: false, fetched_at: Time.current)
    FplClient::Result.new(
      payload: { "elements" => elements, "element_types" => element_types },
      stale: stale, fetched_at: fetched_at
    )
  end

  def entry_result(current_event: 4, stale: false, fetched_at: Time.current)
    FplClient::Result.new(
      payload: { "id" => 123, "name" => "Test FC", "current_event" => current_event },
      stale: stale, fetched_at: fetched_at
    )
  end

  # Build a 15-pick payload from an ordered list of element ids (1..15 => XI+bench).
  def picks_payload(element_ids, bank: 12, captain: nil, vice: nil)
    captain ||= element_ids.first
    vice ||= element_ids[1]
    picks = element_ids.each_with_index.map do |element, index|
      { "element" => element, "position" => index + 1, "multiplier" => 1,
        "is_captain" => element == captain, "is_vice_captain" => element == vice }
    end
    { "picks" => picks, "entry_history" => { "bank" => bank } }
  end

  def picks_result(payload, stale: false, fetched_at: Time.current)
    FplClient::Result.new(payload: payload, stale: stale, fetched_at: fetched_at)
  end

  # XI: 1 GKP, 3 DEF, 4 MID, 3 FWD  => "3-4-3". Bench: 1 GKP, 2 DEF, 1 MID.
  def squad_343
    [ 1, 3, 4, 5, 10, 11, 12, 13, 17, 18, 19, 2, 6, 7, 14 ]
  end

  before do
    allow(FplClient).to receive(:entry).and_return(entry_result)
    allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result)
    allow(FplClient).to receive(:picks).with(123, 4).and_return(picks_result(picks_payload(squad_343)))
  end

  it "assembles 15 picks with names, positions and captain flags resolved from bootstrap" do
    squad = described_class.for(team_id: 123)

    expect(squad.picks.size).to eq(15)
    expect(squad.picks.first.player_id).to eq(1)
    expect(squad.picks.first.name).to eq("Player1")
    expect(squad.picks.first.position).to eq("GKP")
    expect(squad.picks.first.is_captain).to be(true)
    expect(squad.picks.first.now_cost).to eq(41)
    expect(squad.picks.first.element_type).to eq(1)

    vice = squad.picks.find(&:is_vice_captain)
    expect(vice.player_id).to eq(3)

    expect(squad.picks[0..10].map(&:starting)).to all(be(true))
    expect(squad.picks[11..14].map(&:starting)).to all(be(false))
    expect(squad.bank).to eq(12)
    expect(squad.current_event).to eq(4)
  end

  it "derives position names from element_types, not a hardcoded map" do
    weird_types = default_element_types.map { |t| t["id"] == 3 ? t.merge("singular_name_short" => "MIDFIELD") : t }
    allow(FplClient).to receive(:bootstrap_static)
      .and_return(bootstrap_result(element_types: weird_types))

    squad = described_class.for(team_id: 123)

    midfielder = squad.picks.find { |p| p.element_type == 3 }
    expect(midfielder.position).to eq("MIDFIELD")
  end

  describe "formation" do
    it "computes 3-4-3" do
      allow(FplClient).to receive(:picks).with(123, 4).and_return(picks_result(picks_payload(squad_343)))
      expect(described_class.for(team_id: 123).formation).to eq("3-4-3")
    end

    it "computes 4-4-2" do
      xi = [ 1, 3, 4, 5, 6, 10, 11, 12, 13, 17, 18, 2, 7, 8, 14 ]
      allow(FplClient).to receive(:picks).with(123, 4).and_return(picks_result(picks_payload(xi)))
      expect(described_class.for(team_id: 123).formation).to eq("4-4-2")
    end

    it "computes 3-5-2" do
      xi = [ 1, 3, 4, 5, 10, 11, 12, 13, 14, 17, 18, 2, 6, 7, 15 ]
      allow(FplClient).to receive(:picks).with(123, 4).and_return(picks_result(picks_payload(xi)))
      expect(described_class.for(team_id: 123).formation).to eq("3-5-2")
    end
  end

  it "falls back to current_event - 1 when the current gameweek has no picks" do
    allow(FplClient).to receive(:picks).with(123, 4).and_return(picks_result({ "picks" => [] }))
    allow(FplClient).to receive(:picks).with(123, 3).and_return(picks_result(picks_payload(squad_343, bank: 5)))

    squad = described_class.for(team_id: 123)

    expect(squad.current_event).to eq(3)
    expect(squad.picks.size).to eq(15)
    expect(squad.bank).to eq(5)
  end

  it "propagates FplClient::NotFoundError unchanged" do
    allow(FplClient).to receive(:entry).and_raise(FplClient::NotFoundError)
    expect { described_class.for(team_id: 999) }.to raise_error(FplClient::NotFoundError)
  end

  it "propagates FplClient::UnavailableError unchanged" do
    allow(FplClient).to receive(:entry).and_raise(FplClient::UnavailableError)
    expect { described_class.for(team_id: 999) }.to raise_error(FplClient::UnavailableError)
  end

  it "propagates stale state and data_as_of from a stale contributing Result" do
    stale_time = 3.hours.ago
    allow(FplClient).to receive(:bootstrap_static)
      .and_return(bootstrap_result(stale: true, fetched_at: stale_time))

    squad = described_class.for(team_id: 123)

    expect(squad.stale).to be(true)
    expect(squad.data_as_of).to eq(stale_time.iso8601)
  end

  it "leaves data_as_of nil and stale false when nothing is stale" do
    squad = described_class.for(team_id: 123)
    expect(squad.stale).to be(false)
    expect(squad.data_as_of).to be_nil
  end
end
