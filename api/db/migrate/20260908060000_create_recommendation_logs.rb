class CreateRecommendationLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :recommendation_logs do |t|
      t.string :team_id
      t.integer :gameweek
      t.integer :player_id
      t.float :recent_form
      t.integer :fixture_difficulty
      t.integer :minutes_played
      t.float :ownership_percent
      t.float :price
      t.string :home_or_away
      t.integer :opponent_team_id
      t.float :expected_goals
      t.float :expected_assists
      t.integer :chance_of_playing_next_round
      t.string :news
      t.string :formula_version

      t.timestamps
    end
  end
end
