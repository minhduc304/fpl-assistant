require "rails_helper"

RSpec.describe ChartSeries do
  def current_rows
    [
      { "event" => 1, "points" => 62, "overall_rank" => 1_234_567, "value" => 1000 },
      { "event" => 2, "points" => 78, "overall_rank" => 900_000, "value" => 1012 }
    ]
  end

  def history_result(rows: current_rows, stale: false, fetched_at: Time.current)
    FplClient::Result.new(payload: { "current" => rows }, stale: stale, fetched_at: fetched_at)
  end

  it "maps points_per_gameweek to { x: event, y: points }" do
    allow(FplClient).to receive(:history).with(123).and_return(history_result)

    series = described_class.for(team_id: 123, type: "points_per_gameweek")

    expect(series.type).to eq("points_per_gameweek")
    expect(series.points).to eq([{ x: 1, y: 62 }, { x: 2, y: 78 }])
    expect(series.stale).to be(false)
    expect(series.data_as_of).to be_nil
  end

  it "maps rank_trajectory to { x: event, y: overall_rank }" do
    allow(FplClient).to receive(:history).and_return(history_result)

    series = described_class.for(team_id: 123, type: "rank_trajectory")

    expect(series.points).to eq([{ x: 1, y: 1_234_567 }, { x: 2, y: 900_000 }])
  end

  it "maps price_history to { x: event, y: value / 10 }" do
    allow(FplClient).to receive(:history).and_return(history_result)

    series = described_class.for(team_id: 123, type: "price_history")

    expect(series.points).to eq([{ x: 1, y: 100.0 }, { x: 2, y: 101.2 }])
  end

  it "raises InvalidTypeError for an unknown type" do
    expect { described_class.for(team_id: 123, type: "nonsense") }
      .to raise_error(ChartSeries::InvalidTypeError)
  end

  it "exposes data_as_of (iso8601) and stale: true from a stale Result" do
    stale_time = 3.hours.ago
    allow(FplClient).to receive(:history)
      .and_return(history_result(stale: true, fetched_at: stale_time))

    series = described_class.for(team_id: 123, type: "points_per_gameweek")

    expect(series.stale).to be(true)
    expect(series.data_as_of).to eq(stale_time.iso8601)
  end

  it "propagates FplClient::UnavailableError unchanged" do
    allow(FplClient).to receive(:history).and_raise(FplClient::UnavailableError)

    expect { described_class.for(team_id: 999, type: "points_per_gameweek") }
      .to raise_error(FplClient::UnavailableError)
  end
end
