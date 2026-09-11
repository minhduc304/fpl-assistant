class CreateGameweekSnapshots < ActiveRecord::Migration[8.1]
  def change
    create_table :gameweek_snapshots do |t|
      t.integer :gameweek
      t.jsonb :payload
      t.datetime :snapshot_taken_at

      t.timestamps
    end
    add_index :gameweek_snapshots, :gameweek, unique: true
  end
end
