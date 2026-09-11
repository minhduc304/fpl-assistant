require "rails_helper"

RSpec.describe TeamSummary do
  def entry_payload(overrides = {})
    {
      "id" => 123,
      "name" => "Fantasy Wanderers",
      "player_first_name" => "A.",
      "player_last_name" => "Manager",
      "summary_overall_rank" => 154032,
      "summary_overall_points" => 412,
      "current_event" => 4
    }.merge(overrides)
  end

  def entry_result(payload: entry_payload, stale: false, fetched_at: Time.current)
    FplClient::Result.new(payload: payload, stale: stale, fetched_at: fetched_at)
  end

  it "maps every Team field from the entry payload" do
    allow(FplClient).to receive(:entry).with(123).and_return(entry_result)

    team = described_class.for(team_id: 123)

    expect(team.team_id).to eq(123)
    expect(team.name).to eq("Fantasy Wanderers")
    expect(team.manager_name).to eq("A. Manager")
    expect(team.overall_rank).to eq(154032)
    expect(team.total_points).to eq(412)
    expect(team.stale).to be(false)
    expect(team.data_as_of).to be_nil
  end

  it "joins and strips the manager name when a name part is blank" do
    allow(FplClient).to receive(:entry)
      .and_return(entry_result(payload: entry_payload("player_last_name" => "")))

    expect(described_class.for(team_id: 123).manager_name).to eq("A.")
  end

  it "falls back to the passed team_id when the payload has no id" do
    allow(FplClient).to receive(:entry)
      .and_return(entry_result(payload: entry_payload("id" => nil)))

    expect(described_class.for(team_id: "999").team_id).to eq(999)
  end

  it "exposes data_as_of (iso8601) and stale: true from a stale Result" do
    stale_time = 3.hours.ago
    allow(FplClient).to receive(:entry)
      .and_return(entry_result(stale: true, fetched_at: stale_time))

    team = described_class.for(team_id: 123)

    expect(team.stale).to be(true)
    expect(team.data_as_of).to eq(stale_time.iso8601)
  end

  it "propagates FplClient::NotFoundError unchanged" do
    allow(FplClient).to receive(:entry).and_raise(FplClient::NotFoundError)
    expect { described_class.for(team_id: 999) }.to raise_error(FplClient::NotFoundError)
  end

  it "propagates FplClient::UnavailableError unchanged" do
    allow(FplClient).to receive(:entry).and_raise(FplClient::UnavailableError)
    expect { described_class.for(team_id: 999) }.to raise_error(FplClient::UnavailableError)
  end
end
