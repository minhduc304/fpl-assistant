# Turns `FplClient.fixtures` (a bare JSON array of FPL fixture objects) +
# `bootstrap-static` `teams[]` into `Fixture`-shaped records, parsed here in
# exactly one place and consumed by the getFixtures controller.
#
# Shaping:
#   gameweek        = FPL `event` (fixtures with a null event are dropped)
#   home_team       = club `name` resolved from `teams[]` (id -> name)
#   away_team       = club `name`, or nil for a synthetic blank row
#   difficulty_home = FPL `team_h_difficulty` (nil for a blank row)
#   difficulty_away = FPL `team_a_difficulty` (nil for a blank row)
#   is_double_gameweek = a club with >= 2 fixtures in one event -> every fixture
#                        in that event involving that club is flagged
#   is_blank_gameweek  = a club with zero fixtures in an event that otherwise
#                        has >= 1 real fixture -> one synthetic blank row
#
# `gameweek` (== event) and `team_id` (fixture involves that club id; a blank
# row belongs to its club) filters are applied AFTER detection.
#
# Result-object shape mirrors PlayerCatalog::Result: `.fixtures` (Array<Fixture>),
# `.data_as_of` (ISO8601 String, nil unless stale) and `.stale` (bool).
#
# `FplClient::UnavailableError` propagates unchanged — it is never rescued here.
class FixtureBoard
  Fixture = Struct.new(
    :gameweek, :home_team, :away_team, :difficulty_home, :difficulty_away,
    :is_double_gameweek, :is_blank_gameweek,
    keyword_init: true
  )

  Result = Struct.new(:fixtures, :data_as_of, :stale, keyword_init: true)

  class << self
    def list(gameweek: nil, team_id: nil)
      fixtures_result = FplClient.fixtures
      bootstrap_result = FplClient.bootstrap_static

      teams = index_by_id(bootstrap_result.payload["teams"])
      raw = Array(fixtures_result.payload).select { |fixture| fixture["event"] }

      fixtures = build_fixtures(raw, teams)
      fixtures = apply_filters(fixtures, raw, teams, gameweek, team_id)

      contributing = [ fixtures_result, bootstrap_result ]
      Result.new(
        fixtures: fixtures,
        data_as_of: data_as_of(contributing),
        stale: contributing.any?(&:stale?)
      )
    end

    private

    def build_fixtures(raw, teams)
      dgw_club_ids_by_event = double_gameweek_club_ids(raw)

      real = raw.map do |fixture|
        event = fixture["event"]
        dgw_ids = dgw_club_ids_by_event[event]
        involved = [ fixture["team_h"], fixture["team_a"] ]

        Fixture.new(
          gameweek: event,
          home_team: club_name(teams, fixture["team_h"]),
          away_team: club_name(teams, fixture["team_a"]),
          difficulty_home: fixture["team_h_difficulty"],
          difficulty_away: fixture["team_a_difficulty"],
          is_double_gameweek: involved.any? { |id| dgw_ids.include?(id) },
          is_blank_gameweek: false
        )
      end

      real + blank_fixtures(raw, teams)
    end

    # Per event, club ids (home or away) that appear in >= 2 fixtures.
    def double_gameweek_club_ids(raw)
      raw.group_by { |fixture| fixture["event"] }.transform_values do |event_fixtures|
        counts = Hash.new(0)
        event_fixtures.each do |fixture|
          counts[fixture["team_h"]] += 1
          counts[fixture["team_a"]] += 1
        end
        counts.select { |_id, count| count >= 2 }.keys.to_set
      end
    end

    # One synthetic blank row per club with zero fixtures in an active event.
    def blank_fixtures(raw, teams)
      all_club_ids = teams.keys

      raw.group_by { |fixture| fixture["event"] }.flat_map do |event, event_fixtures|
        playing = event_fixtures.flat_map { |fixture| [ fixture["team_h"], fixture["team_a"] ] }.to_set

        (all_club_ids - playing.to_a).map do |club_id|
          Fixture.new(
            gameweek: event,
            home_team: club_name(teams, club_id),
            away_team: nil,
            difficulty_home: nil,
            difficulty_away: nil,
            is_double_gameweek: false,
            is_blank_gameweek: true
          )
        end
      end
    end

    def apply_filters(fixtures, raw, teams, gameweek, team_id)
      fixtures = fixtures.select { |fixture| fixture.gameweek == gameweek } if gameweek
      return fixtures unless team_id

      wanted_name = club_name(teams, team_id)
      fixtures.select do |fixture|
        if fixture.is_blank_gameweek
          fixture.home_team == wanted_name
        else
          [ fixture.home_team, fixture.away_team ].include?(wanted_name)
        end
      end
    end

    def club_name(teams, club_id)
      teams.fetch(club_id, {})["name"]
    end

    def index_by_id(collection)
      Array(collection).index_by { |item| item["id"] }
    end

    # Newest stale fetched_at across the contributing results, else nil
    # (mirrors squad_assembler.rb / player_catalog.rb).
    def data_as_of(results)
      stale_results = results.select(&:stale?)
      return nil if stale_results.empty?

      stale_results.max_by(&:fetched_at).fetched_at.iso8601
    end
  end
end
