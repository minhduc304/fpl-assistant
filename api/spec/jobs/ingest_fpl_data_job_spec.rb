require "rails_helper"
require "webmock/rspec"

RSpec.describe IngestFplDataJob do
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

  describe "#live_gameweek?" do
    it "returns true when a cached event's deadline has passed but it isn't finished" do
      ApiCache.create!(resource: "bootstrap-static", payload: bootstrap_payload(events: [ live_event ]), fetched_at: Time.current)

      expect(described_class.new.live_gameweek?).to eq(true)
    end

    it "returns false when there is no live event" do
      ApiCache.create!(resource: "bootstrap-static", payload: bootstrap_payload(events: [ finished_event, upcoming_event ]), fetched_at: Time.current)

      expect(described_class.new.live_gameweek?).to eq(false)
    end

    it "returns false when bootstrap-static isn't cached yet" do
      expect(described_class.new.live_gameweek?).to eq(false)
    end
  end

  describe "#perform" do
    it "calls FplClient.bootstrap_static then FplClient.fixtures" do
      call_order = []
      allow(FplClient).to receive(:bootstrap_static) { call_order << :bootstrap_static }
      allow(FplClient).to receive(:fixtures) { call_order << :fixtures }

      described_class.new.perform

      expect(FplClient).to have_received(:bootstrap_static)
      expect(FplClient).to have_received(:fixtures)
      expect(call_order).to eq([ :bootstrap_static, :fixtures ])
    end
  end
end
