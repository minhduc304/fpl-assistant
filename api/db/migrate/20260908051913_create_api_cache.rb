class CreateApiCache < ActiveRecord::Migration[8.1]
  def change
    create_table :api_cache do |t|
      t.string :resource
      t.jsonb :payload
      t.datetime :fetched_at

      t.timestamps
    end
    add_index :api_cache, :resource, unique: true
  end
end
