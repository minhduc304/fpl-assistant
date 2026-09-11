# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_09_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "api_cache", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "fetched_at"
    t.jsonb "payload"
    t.string "resource"
    t.datetime "updated_at", null: false
    t.index ["resource"], name: "index_api_cache_on_resource", unique: true
  end

  create_table "gameweek_snapshots", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "gameweek"
    t.jsonb "payload"
    t.datetime "snapshot_taken_at"
    t.datetime "updated_at", null: false
    t.index ["gameweek"], name: "index_gameweek_snapshots_on_gameweek", unique: true
  end

  create_table "recommendation_logs", force: :cascade do |t|
    t.integer "chance_of_playing_next_round"
    t.datetime "created_at", null: false
    t.float "expected_assists"
    t.float "expected_goals"
    t.integer "fixture_difficulty"
    t.string "formula_version"
    t.integer "gameweek"
    t.string "home_or_away"
    t.integer "minutes_played"
    t.string "news"
    t.integer "opponent_team_id"
    t.float "ownership_percent"
    t.integer "player_id"
    t.integer "player_out_id"
    t.float "price"
    t.float "recent_form"
    t.string "recommendation_type", default: "captain", null: false
    t.string "team_id"
    t.datetime "updated_at", null: false
  end
end
