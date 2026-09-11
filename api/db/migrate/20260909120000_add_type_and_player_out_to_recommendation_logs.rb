class AddTypeAndPlayerOutToRecommendationLogs < ActiveRecord::Migration[8.1]
  def change
    # default "captain" backfills existing rows and keeps the column non-null
    # for any caller that forgets to set it; the captain/transfer paths both
    # set it explicitly.
    add_column :recommendation_logs, :recommendation_type, :string, null: false, default: "captain"
    add_column :recommendation_logs, :player_out_id, :integer
  end
end
