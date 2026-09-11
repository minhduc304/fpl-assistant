require "rails_helper"

RSpec.describe SnapshotGameweekJob do
  def bootstrap_payload(events:)
    { "events" => events }
  end

  def cache_bootstrap!(events:)
    ApiCache.create!(resource: "bootstrap-static", payload: bootstrap_payload(events: events), fetched_at: Time.current)
  end

  describe "#perform" do
    it "does not snapshot a gameweek that is finished but not yet data_checked" do
      cache_bootstrap!(events: [ { "id" => 1, "finished" => true, "data_checked" => false } ])

      described_class.new.perform

      expect(GameweekSnapshot.find_by(gameweek: 1)).to be_nil
    end

    it "takes a snapshot when the gameweek is finished and data_checked" do
      event = { "id" => 1, "finished" => true, "data_checked" => true, "points" => 55 }
      cache_bootstrap!(events: [ event ])

      described_class.new.perform

      snapshot = GameweekSnapshot.find_by(gameweek: 1)
      expect(snapshot).to be_present
      expect(snapshot.payload).to eq(event)
      expect(snapshot.snapshot_taken_at).to be_present
    end

    it "does not re-write an already-snapshotted gameweek on a second run" do
      event = { "id" => 1, "finished" => true, "data_checked" => true, "points" => 55 }
      cache_bootstrap!(events: [ event ])

      described_class.new.perform
      snapshot = GameweekSnapshot.find_by(gameweek: 1)
      original_snapshot_taken_at = snapshot.snapshot_taken_at
      original_payload = snapshot.payload

      # Even if the cached event data changed, an already-snapshotted
      # gameweek must be left untouched.
      updated_event = event.merge("points" => 999)
      ApiCache.find_by(resource: "bootstrap-static").update!(payload: bootstrap_payload(events: [ updated_event ]))

      described_class.new.perform

      snapshot.reload
      expect(snapshot.snapshot_taken_at).to eq(original_snapshot_taken_at)
      expect(snapshot.payload).to eq(original_payload)
    end
  end
end
