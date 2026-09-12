# Turns FPL `bootstrap-static` into `Player`-shaped records, parsed here in
# exactly one place and consumed by the getPlayerStats / searchPlayers /
# comparePlayers controllers.
#
# Derivation (no hardcoded position or team map):
#   name         = element `web_name`
#   team         = club `name` resolved from `teams[]` (id -> name)
#   position     = `element_types[].singular_name_short` (GKP/DEF/MID/FWD)
#   price        = `now_cost` / 10.0
#   total_points = element `total_points`
#   form         = element `form` (string) -> Float
#
# Result-object shape:
#   - `find` returns a bare `Player` struct (each Player carries its own
#     `data_as_of` / `stale`, mirroring the OpenAPI `Player` schema).
#   - `search` and `by_ids` return a `PlayerCatalog::Result` with `.players`
#     (Array<Player>), `.data_as_of` (ISO8601 String, nil unless stale) and
#     `.stale` (bool) — the exact shape the list controllers render as
#     `{ players: [...], data_as_of:, stale: }`.
#
# `data_as_of` = `FplClient::Result#fetched_at.iso8601` when the result is
# stale, otherwise nil (mirrors squad_assembler.rb).
#
# `FplClient::UnavailableError` propagates unchanged — it is never rescued here.
class PlayerCatalog
  POSITIONS = %w[GKP DEF MID FWD].freeze

  Player = Struct.new(
    :player_id, :name, :team, :position, :price, :total_points, :form,
    :data_as_of, :stale,
    keyword_init: true
  )

  Result = Struct.new(:players, :data_as_of, :stale, keyword_init: true)

  class NotFoundError < StandardError; end

  class << self
    def find(player_id)
      catalog = load_catalog
      element = catalog.elements[player_id]
      raise NotFoundError, "No player with id #{player_id}" unless element

      build_player(element, catalog)
    end

    def search(query: nil, position: nil, team: nil)
      catalog = load_catalog
      players = catalog.elements.values.map { |element| build_player(element, catalog) }

      players = players.select { |p| matches_query?(p, catalog.elements[p.player_id], query) } if query.present?
      players = filter_by_position(players, position)
      players = players.select { |p| matches_team?(p, catalog.elements[p.player_id], catalog, team) } if team.present?

      wrap(players, catalog)
    end

    def by_ids(ids)
      catalog = load_catalog
      players = Array(ids).filter_map do |id|
        element = catalog.elements[id]
        build_player(element, catalog) if element
      end

      wrap(players, catalog)
    end

    private

    Catalog = Struct.new(:elements, :teams, :element_types, :data_as_of, :stale, keyword_init: true)

    def load_catalog
      result = FplClient.bootstrap_static
      payload = result.payload

      Catalog.new(
        elements: index_by_id(payload["elements"]),
        teams: index_by_id(payload["teams"]),
        element_types: index_by_id(payload["element_types"]),
        data_as_of: result.stale? ? result.fetched_at.iso8601 : nil,
        stale: result.stale?
      )
    end

    def build_player(element, catalog)
      club = catalog.teams.fetch(element["team"], {})
      element_type = catalog.element_types.fetch(element["element_type"], {})

      Player.new(
        player_id: element["id"],
        name: element["web_name"],
        team: club["name"],
        position: element_type["singular_name_short"],
        price: element["now_cost"].to_i / 10.0,
        total_points: element["total_points"],
        form: element["form"].to_f,
        data_as_of: catalog.data_as_of,
        stale: catalog.stale
      )
    end

    def matches_query?(_player, element, query)
      needle = query.downcase
      full_name = "#{element['first_name']} #{element['second_name']}"
      element["web_name"].to_s.downcase.include?(needle) || full_name.downcase.include?(needle)
    end

    # Only applies when `position` is one of the 4 short names; any other value
    # (nil included) leaves the list untouched.
    def filter_by_position(players, position)
      return players if position.blank?

      wanted = position.to_s.upcase
      return players unless POSITIONS.include?(wanted)

      players.select { |p| p.position == wanted }
    end

    def matches_team?(_player, element, catalog, team)
      needle = team.downcase
      club = catalog.teams.fetch(element["team"], {})
      [club["name"], club["short_name"]].compact.map(&:downcase).include?(needle)
    end

    def wrap(players, catalog)
      Result.new(players: players, data_as_of: catalog.data_as_of, stale: catalog.stale)
    end

    def index_by_id(collection)
      Array(collection).index_by { |item| item["id"] }
    end
  end
end
