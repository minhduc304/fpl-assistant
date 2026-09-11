# Takes a one-time snapshot of each finished gameweek's data into
# `gameweek_snapshots`, once bootstrap-static reports it as fully settled
# (finished + data_checked). For now the snapshotted payload is just the
# matching bootstrap-static event hash -- a placeholder for the real
# squad/points/rank data a later task will populate -- but the
# idempotency mechanics here are real: `snapshot_taken_at` is the sole
# guard, checked BEFORE any work is done, so a gameweek is never
# reprocessed once it has been snapshotted (relevant even though this
# implementation does no extra fetching, since a future version might).
#
# This job never triggers a fresh FPL fetch itself -- it only reads the
# already-cached bootstrap-static row (same read-only pattern as
# IngestFplDataJob's live_gameweek? check), reacting to whatever
# IngestFplDataJob has already cached.
class SnapshotGameweekJob < ApplicationJob
  queue_as :default

  def perform
    Array(bootstrap_events).each do |event|
      next unless event["finished"] && event["data_checked"]

      gameweek = event["id"]
      next if already_snapshotted?(gameweek)

      snapshot = GameweekSnapshot.find_or_initialize_by(gameweek: gameweek)
      snapshot.payload = event
      snapshot.snapshot_taken_at = Time.current
      snapshot.save!
    end
  end

  private

  def already_snapshotted?(gameweek)
    GameweekSnapshot.where(gameweek: gameweek).where.not(snapshot_taken_at: nil).exists?
  end

  def bootstrap_events
    bootstrap = ApiCache.find_by(resource: "bootstrap-static")
    return [] unless bootstrap&.payload

    bootstrap.payload["events"]
  end
end
