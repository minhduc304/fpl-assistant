# Shared recommendation-builder service (TDD-fpl-assistant.md,
# "Recommendation-contract behavior") — every opinionated tool (captain,
# transfer, chip timing) funnels through here so the RecommendationContract
# shape can't drift between tools. This task only implements suggest_captain.
class RecommendationBuilder
  # Bumped whenever the scoring formula changes; logged alongside each
  # recommendation (see log_recommendation / recommendation_logs table).
  FORMULA_VERSION = "v1-form-fdr".freeze

  # Transfer scoring reuses the captain form/FDR formula verbatim (score_element),
  # adding an "own-status override" (a non-available owned player scores 0).
  TRANSFER_FORMULA_VERSION = "v1-transfer-form-fdr-own".freeze

  ALTERNATIVES_COUNT = 3
  WORST_FDR = 5

  # player_in candidates are never a definitely-out player. Doubtful ("d") is allowed.
  UNAVAILABLE_IN_STATUSES = %w[i s u].freeze

  # Raised only when, even with the risk and affordability filters both dropped,
  # no non-owned same-type player is fieldable for ANY owned player.
  class NoTransferCandidateError < StandardError; end

  class << self
    def suggest_captain(team_id:, gameweek: nil)
      squad = SquadAssembler.for(team_id: team_id)
      bootstrap_result = FplClient.bootstrap_static
      fixtures_result = FplClient.fixtures

      # FplClient.fixtures' payload is the raw FPL "fixtures/" response, which
      # is a bare JSON array of fixture objects (not wrapped in a hash key).
      fixtures = Array(fixtures_result.payload)

      elements_by_id = Array(bootstrap_result.payload["elements"]).index_by { |element| element["id"] }
      starting = squad.picks.select(&:starting)
      squad_elements = starting.filter_map { |pick| elements_by_id[pick.player_id] }

      # No resolvable starting XI (season not started / brand-new team with no
      # locked-in squad yet) -> a clean degraded state, never a raw crash.
      raise FplClient::UnavailableError, "no squad data available to suggest a captain" if squad_elements.empty?

      scored = squad_elements.map { |element| score_element(element, fixtures) }
      scored.sort_by! { |candidate| -candidate[:score] }

      top = scored.first
      sample_size = relevant_gameweeks(top[:element], bootstrap_result.payload)

      log_recommendation(team_id: team_id, gameweek: gameweek, top: top, fixtures: fixtures)

      {
        recommendation: player_ref(top[:element]),
        confidence: RecommendationContract.confidence_for(sample_size),
        reasoning: reasoning_for(top, sample_size),
        alternatives: build_alternatives(scored, top, sample_size),
        data_as_of: combined_data_as_of(squad, bootstrap_result, fixtures_result)
      }
    end

    # Candidate selection + scoring (Task 23); reasoning, confidence, and the
    # BL-002 recommendation_logs write (Task 24). `relaxations` (which empty-pool
    # filters were dropped) stays internal — it feeds the `candidate_pool`
    # reasoning entry but is not part of the public RecommendationContract shape.
    def suggest_transfer(team_id:, risk_tolerance: "balanced")
      squad = SquadAssembler.for(team_id: team_id)
      bootstrap_result = FplClient.bootstrap_static
      fixtures_result = FplClient.fixtures

      elements = Array(bootstrap_result.payload["elements"])
      fixtures = Array(fixtures_result.payload)
      elements_by_id = elements.index_by { |element| element["id"] }
      owned_ids = squad.picks.map(&:player_id)
      bank = squad.bank.to_i

      outs = squad.picks.filter_map do |pick|
        element = elements_by_id[pick.player_id]
        next unless element

        raw_score = score_element(element, fixtures)[:score]
        score = element["status"] == "a" ? raw_score : 0.0
        { element: element, now_cost: element["now_cost"].to_i, element_type: element["element_type"], score: score }
      end

      relaxations = []
      pairs = transfer_pairs(outs, elements, fixtures, owned_ids, bank, risk_tolerance, drop_risk: false, drop_afford: false)

      if pairs.empty?
        relaxations << :risk
        pairs = transfer_pairs(outs, elements, fixtures, owned_ids, bank, risk_tolerance, drop_risk: true, drop_afford: false)
      end

      if pairs.empty?
        relaxations << :affordability
        pairs = transfer_pairs(outs, elements, fixtures, owned_ids, bank, risk_tolerance, drop_risk: true, drop_afford: true)
      end

      raise NoTransferCandidateError, "no fieldable transfer target for any owned player" if pairs.empty?

      pairs.sort_by! { |pair| -pair[:gain] }
      top = pairs.first

      sample_size = relevant_gameweeks(top[:in], bootstrap_result.payload)

      log_transfer_recommendation(team_id: team_id, squad: squad, top: top, fixtures: fixtures)

      {
        recommendation: { player_out: player_ref(top[:out][:element]), player_in: player_ref(top[:in]) },
        confidence: RecommendationContract.confidence_for(sample_size),
        reasoning: transfer_reasoning_for(top, sample_size, risk_tolerance, relaxations, fixtures),
        alternatives: build_transfer_alternatives(pairs, top, bootstrap_result.payload, fixtures),
        data_as_of: combined_data_as_of(squad, bootstrap_result, fixtures_result)
      }
    end

    private

    # Every (owned player_out, qualifying player_in) pair, with swap gain.
    def transfer_pairs(outs, elements, fixtures, owned_ids, bank, risk_tolerance, drop_risk:, drop_afford:)
      outs.flat_map do |out|
        elements.filter_map do |candidate|
          next if owned_ids.include?(candidate["id"])
          next unless candidate["element_type"] == out[:element_type]
          next if UNAVAILABLE_IN_STATUSES.include?(candidate["status"])
          next unless drop_afford || candidate["now_cost"].to_i <= bank + out[:now_cost]
          next unless drop_risk || passes_risk_filter?(candidate, risk_tolerance)

          in_score = score_element(candidate, fixtures)[:score]
          { out: out, in: candidate, gain: in_score - out[:score] }
        end
      end
    end

    def passes_risk_filter?(candidate, risk_tolerance)
      ownership = candidate["selected_by_percent"].to_f

      case risk_tolerance
      when "safe" then ownership >= 15.0
      when "differential" then ownership <= 10.0
      else true
      end
    end

    def build_transfer_alternatives(pairs, top, bootstrap_payload, fixtures)
      pairs[1, ALTERNATIVES_COUNT].to_a.map do |pair|
        {
          option: { player_out: player_ref(pair[:out][:element]), player_in: player_ref(pair[:in]) },
          reasoning: transfer_alternative_reasoning(pair, bootstrap_payload, fixtures),
          why_not_top_pick: "Lower projected gain (#{pair[:gain].round(2)} vs #{top[:gain].round(2)})"
        }
      end
    end

    # player_in-centric reasoning for the winning swap. transfer_cost /
    # affordability have no real sample, so sample_size: 1 (matching how the
    # captain path treats fixture_difficulty).
    def transfer_reasoning_for(pair, sample_size, risk_tolerance, relaxations, fixtures)
      player_in = pair[:in]
      scored = score_element(player_in, fixtures)

      entries = [
        {
          factor: "recent_form",
          detail: "player_in averaging #{format('%.2f', scored[:avg_points_per_game])} points per game",
          sample_size: sample_size
        },
        {
          factor: "fixture_difficulty",
          detail: "player_in's next fixture rated #{scored[:fdr]}/5 difficulty",
          sample_size: 1
        },
        {
          factor: "expected_gain",
          detail: "Projected points gain of #{format('%.2f', pair[:gain])} over the current pick",
          sample_size: 1
        },
        {
          factor: "transfer_cost",
          detail: "Likely a -4 point hit unless a free transfer is available",
          sample_size: 1
        },
        {
          factor: "affordability",
          detail: "Sale value estimated at current price; the actual selling price may be lower",
          sample_size: 1
        }
      ]

      if risk_tolerance != "balanced" && !relaxations.include?(:risk)
        ownership = player_in["selected_by_percent"].to_f
        label = risk_tolerance == "safe" ? "widely-owned safe pick" : "differential pick"
        entries << {
          factor: "ownership",
          detail: "player_in owned by #{ownership}% of managers (#{label})",
          sample_size: 1
        }
      end

      if relaxations.any?
        detail = "No candidate matched the requested risk profile; widened the search"
        detail += "; relaxed the budget constraint" if relaxations.include?(:affordability)
        entries << { factor: "candidate_pool", detail: detail, sample_size: 1 }
      end

      entries
    end

    def transfer_alternative_reasoning(pair, bootstrap_payload, fixtures)
      player_in = pair[:in]
      scored = score_element(player_in, fixtures)

      [
        {
          factor: "recent_form",
          detail: "player_in averaging #{format('%.2f', scored[:avg_points_per_game])} points per game",
          sample_size: relevant_gameweeks(player_in, bootstrap_payload)
        },
        {
          factor: "fixture_difficulty",
          detail: "player_in's next fixture rated #{scored[:fdr]}/5 difficulty",
          sample_size: 1
        },
        {
          factor: "expected_gain",
          detail: "Projected points gain of #{format('%.2f', pair[:gain])} over the current pick",
          sample_size: 1
        }
      ]
    end

    # BL-002: log each generated transfer recommendation (chosen pair only).
    # Mirrors log_recommendation — reuses already-fetched data, and a logging
    # failure must never break the response.
    def log_transfer_recommendation(team_id:, squad:, top:, fixtures:)
      element = top[:in]
      scored = score_element(element, fixtures)
      next_fixture = next_fixture_for_team(element["team"], fixtures)
      is_home = next_fixture && next_fixture["team_h"] == element["team"]

      RecommendationLog.create!(
        recommendation_type: "transfer",
        team_id: team_id.to_s,
        gameweek: squad.current_event,
        player_id: element["id"],
        player_out_id: top[:out][:element]["id"],
        recent_form: scored[:avg_points_per_game],
        fixture_difficulty: scored[:fdr],
        minutes_played: element["minutes"],
        ownership_percent: element["selected_by_percent"]&.to_f,
        price: element["now_cost"] ? element["now_cost"].to_f / 10 : nil,
        home_or_away: next_fixture ? (is_home ? "home" : "away") : nil,
        opponent_team_id: next_fixture ? (is_home ? next_fixture["team_a"] : next_fixture["team_h"]) : nil,
        expected_goals: element["expected_goals"]&.to_f,
        expected_assists: element["expected_assists"]&.to_f,
        chance_of_playing_next_round: element["chance_of_playing_next_round"],
        news: element["news"],
        formula_version: TRANSFER_FORMULA_VERSION
      )
    rescue StandardError => e
      Rails.logger.error("RecommendationLog: failed to log recommendation - #{e.class}: #{e.message}")
    end

    # Newest stale timestamp across the squad fetch and the two FplClient results.
    def combined_data_as_of(squad, bootstrap_result, fixtures_result)
      candidates = [ data_as_of(bootstrap_result, fixtures_result) ]
      candidates << squad.data_as_of if squad.stale
      candidates.compact.max
    end

    def score_element(element, fixtures)
      avg_points_per_game = element["points_per_game"].to_f
      fdr = fdr_for_team(element["team"], fixtures)
      score = avg_points_per_game * (6 - fdr) / 5.0

      { element: element, avg_points_per_game: avg_points_per_game, fdr: fdr, score: score }
    end

    def fdr_for_team(team_id, fixtures)
      next_fixture = next_fixture_for_team(team_id, fixtures)

      return WORST_FDR unless next_fixture

      next_fixture["team_h"] == team_id ? next_fixture["team_h_difficulty"] : next_fixture["team_a_difficulty"]
    end

    def next_fixture_for_team(team_id, fixtures)
      fixtures
        .select { |fixture| !fixture["finished"] && fixture["event"] && [ fixture["team_h"], fixture["team_a"] ].include?(team_id) }
        .min_by { |fixture| fixture["event"] }
    end

    # BL-002: log each generated captain recommendation (top candidate only)
    # for future ML evaluation. Reuses data already fetched/computed above —
    # no additional FplClient calls. A logging failure must never break the
    # actual recommendation response.
    def log_recommendation(team_id:, gameweek:, top:, fixtures:)
      element = top[:element]
      next_fixture = next_fixture_for_team(element["team"], fixtures)
      is_home = next_fixture && next_fixture["team_h"] == element["team"]

      RecommendationLog.create!(
        recommendation_type: "captain",
        team_id: team_id.to_s,
        gameweek: gameweek,
        player_id: element["id"],
        recent_form: top[:avg_points_per_game],
        fixture_difficulty: top[:fdr],
        minutes_played: element["minutes"],
        ownership_percent: element["selected_by_percent"]&.to_f,
        price: element["now_cost"] ? element["now_cost"].to_f / 10 : nil,
        home_or_away: next_fixture ? (is_home ? "home" : "away") : nil,
        opponent_team_id: next_fixture ? (is_home ? next_fixture["team_a"] : next_fixture["team_h"]) : nil,
        expected_goals: element["expected_goals"]&.to_f,
        expected_assists: element["expected_assists"]&.to_f,
        chance_of_playing_next_round: element["chance_of_playing_next_round"],
        news: element["news"],
        formula_version: FORMULA_VERSION
      )
    rescue StandardError => e
      Rails.logger.error("RecommendationLog: failed to log recommendation - #{e.class}: #{e.message}")
    end

    def player_ref(element)
      name = element["web_name"].presence || "#{element['first_name']} #{element['second_name']}".strip
      { player_id: element["id"], name: name }
    end

    # Sample size behind avg_points_per_game (which is season-cumulative on
    # bootstrap-static). Prefer the player's own "starts" count; fall back to
    # the number of finished events in the cached bootstrap-static payload.
    def relevant_gameweeks(element, bootstrap_payload)
      starts = element["starts"]
      return starts.to_i if starts.present? && starts.to_i.positive?

      Array(bootstrap_payload["events"]).count { |event| event["finished"] }
    end

    def reasoning_for(candidate, sample_size)
      [
        {
          factor: "recent_form",
          detail: "Averaging #{candidate[:avg_points_per_game].round(2)} points per game",
          sample_size: sample_size
        },
        {
          factor: "fixture_difficulty",
          detail: "Next fixture rated #{candidate[:fdr]}/5 difficulty",
          sample_size: 1
        }
      ]
    end

    def build_alternatives(scored, top, sample_size)
      scored[1, ALTERNATIVES_COUNT].to_a.map do |candidate|
        {
          option: player_ref(candidate[:element]),
          reasoning: reasoning_for(candidate, sample_size),
          why_not_top_pick: "Lower score (#{candidate[:score].round(2)} vs #{top[:score].round(2)})"
        }
      end
    end

    def data_as_of(bootstrap_result, fixtures_result)
      stale_results = [ bootstrap_result, fixtures_result ].select(&:stale?)
      return nil if stale_results.empty?

      stale_results.max_by(&:fetched_at).fetched_at.iso8601
    end
  end
end
