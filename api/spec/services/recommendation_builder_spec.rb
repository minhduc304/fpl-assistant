require "rails_helper"

RSpec.describe RecommendationBuilder do
  def element(id:, team:, total_points:, points_per_game:, web_name:, starts: nil)
    {
      "id" => id,
      "team" => team,
      "total_points" => total_points,
      "points_per_game" => points_per_game,
      "web_name" => web_name,
      "first_name" => web_name,
      "second_name" => "Player",
      "starts" => starts
    }
  end

  def fixture(event:, team_h:, team_a:, team_h_difficulty:, team_a_difficulty:, finished: false)
    {
      "event" => event,
      "team_h" => team_h,
      "team_a" => team_a,
      "team_h_difficulty" => team_h_difficulty,
      "team_a_difficulty" => team_a_difficulty,
      "finished" => finished
    }
  end

  def bootstrap_result(elements:, events: [ { "finished" => true }, { "finished" => true } ], stale: false, fetched_at: Time.zone.now)
    FplClient::Result.new(payload: { "elements" => elements, "events" => events }, stale: stale, fetched_at: fetched_at)
  end

  def fixtures_result(fixtures:, stale: false, fetched_at: Time.zone.now)
    FplClient::Result.new(payload: fixtures, stale: stale, fetched_at: fetched_at)
  end

  # Low-scoring filler players padding the starting XI without affecting who wins.
  def filler_elements(count, start_id:)
    Array.new(count) do |i|
      element(id: start_id + i, team: 99, total_points: 1, points_per_game: "0.1", web_name: "Filler#{i}")
    end
  end

  # A SquadAssembler::Squad whose starting XI is the first 11 of `elements`.
  def captain_squad(elements, stale: false, data_as_of: nil)
    picks = elements.each_with_index.map do |el, index|
      SquadAssembler::Pick.new(
        player_id: el["id"], name: el["web_name"], position: "MID",
        is_captain: false, is_vice_captain: false, now_cost: 50,
        element_type: 3, starting: index < 11
      )
    end
    SquadAssembler::Squad.new(
      picks: picks, formation: "4-4-2", bank: 0,
      current_event: 7, data_as_of: data_as_of, stale: stale
    )
  end

  def stub_captain_squad(elements, **opts)
    allow(SquadAssembler).to receive(:for).and_return(captain_squad(elements, **opts))
  end

  describe ".suggest_captain" do
    it "picks the top scorer by avg_points_per_game * (6 - fdr) / 5 and builds alternatives" do
      salah = element(id: 302, team: 1, total_points: 200, points_per_game: "8.0", web_name: "M.Salah", starts: 6)
      haaland = element(id: 401, team: 2, total_points: 190, points_per_game: "9.0", web_name: "E.Haaland", starts: 6)
      others = filler_elements(9, start_id: 500)

      elements = [ salah, haaland ] + others
      stub_captain_squad(elements)

      # Salah: easy fixture (difficulty 2) => score = 8.0 * (6-2)/5 = 6.4
      # Haaland: hard fixture (difficulty 5) => score = 9.0 * (6-5)/5 = 1.8
      fixtures = [
        fixture(event: 7, team_h: 1, team_a: 3, team_h_difficulty: 2, team_a_difficulty: 4),
        fixture(event: 7, team_h: 2, team_a: 4, team_h_difficulty: 5, team_a_difficulty: 3)
      ]

      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: fixtures))

      result = described_class.suggest_captain(team_id: 1234567)

      expect(result[:recommendation]).to eq(player_id: 302, name: "M.Salah")
      expect(result[:alternatives]).not_to be_empty
      expect(result[:alternatives].first[:option][:player_id]).to eq(401)
      expect(result[:alternatives].first[:why_not_top_pick]).to include("Lower score")
      expect(result[:reasoning].map { |r| r[:factor] }).to include("recent_form", "fixture_difficulty")

      log = RecommendationLog.last
      expect(log.recommendation_type).to eq("captain")
      expect(log.team_id).to eq("1234567")
      expect(log.player_id).to eq(302)
      expect(log.formula_version).to eq(RecommendationBuilder::FORMULA_VERSION)
      expect(log.recent_form).to eq(8.0)
      expect(log.fixture_difficulty).to eq(2)
    end

    it "returns the exact RecommendationContract keys" do
      elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 6) ] + filler_elements(10, start_id: 100)
      stub_captain_squad(elements)
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

      result = described_class.suggest_captain(team_id: 1)

      expect(result.keys).to match_array(%i[recommendation confidence reasoning alternatives data_as_of])
    end

    describe "confidence via RecommendationContract.confidence_for" do
      it "is low when the sample size is below LOW_CONFIDENCE_MAX_GAMEWEEKS" do
        elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 2) ] + filler_elements(10, start_id: 100)
        stub_captain_squad(elements)
        allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
        allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

        result = described_class.suggest_captain(team_id: 1)

        expect(result[:confidence]).to eq("low")
      end

      it "is medium when the sample size is within the medium band" do
        elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 5) ] + filler_elements(10, start_id: 100)
        stub_captain_squad(elements)
        allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
        allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

        result = described_class.suggest_captain(team_id: 1)

        expect(result[:confidence]).to eq("medium")
      end

      it "is high when the sample size is at or above HIGH_CONFIDENCE_MIN_GAMEWEEKS" do
        elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 15) ] + filler_elements(10, start_id: 100)
        stub_captain_squad(elements)
        allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
        allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

        result = described_class.suggest_captain(team_id: 1)

        expect(result[:confidence]).to eq("high")
      end
    end

    it "sets data_as_of from a stale Result's fetched_at" do
      elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 6) ] + filler_elements(10, start_id: 100)
      stale_time = 2.hours.ago

      stub_captain_squad(elements)
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements, stale: true, fetched_at: stale_time))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

      result = described_class.suggest_captain(team_id: 1)

      expect(result[:data_as_of]).to eq(stale_time.iso8601)
    end

    it "leaves data_as_of nil when neither Result is stale" do
      elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 6) ] + filler_elements(10, start_id: 100)
      stub_captain_squad(elements)
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

      result = described_class.suggest_captain(team_id: 1)

      expect(result[:data_as_of]).to be_nil
    end

    it "does not rescue FplClient::UnavailableError; it propagates to the caller" do
      stub_captain_squad([ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 6) ])
      allow(FplClient).to receive(:bootstrap_static).and_raise(FplClient::UnavailableError, "no data")

      expect { described_class.suggest_captain(team_id: 1) }.to raise_error(FplClient::UnavailableError)
    end

    it "does not rescue FplClient::NotFoundError from SquadAssembler; it propagates" do
      allow(SquadAssembler).to receive(:for).and_raise(FplClient::NotFoundError, "no such team")

      expect { described_class.suggest_captain(team_id: 1) }.to raise_error(FplClient::NotFoundError)
    end

    it "does not rescue FplClient::UnavailableError from SquadAssembler; it propagates" do
      allow(SquadAssembler).to receive(:for).and_raise(FplClient::UnavailableError, "squad unavailable")

      expect { described_class.suggest_captain(team_id: 1) }.to raise_error(FplClient::UnavailableError)
    end

    it "raises UnavailableError (degraded state, not a crash) when the squad has no resolvable starting XI" do
      elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "Solo", starts: 6) ]
      allow(SquadAssembler).to receive(:for).and_return(
        SquadAssembler::Squad.new(picks: [], formation: "", bank: 0, current_event: 7, data_as_of: nil, stale: false)
      )
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

      expect { described_class.suggest_captain(team_id: 1) }.to raise_error(FplClient::UnavailableError)
    end

    it "assigns fdr = 5 to a player whose team has no next fixture (blank gameweek) without crashing" do
      blank_gw_player = element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "BlankGW", starts: 6)
      elements = [ blank_gw_player ] + filler_elements(10, start_id: 100)

      stub_captain_squad(elements)
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))

      expect { described_class.suggest_captain(team_id: 1) }.not_to raise_error

      result = described_class.suggest_captain(team_id: 1)
      fixture_reasoning = result[:reasoning].find { |r| r[:factor] == "fixture_difficulty" }
      expect(fixture_reasoning[:detail]).to include("5/5")
    end

    it "still returns the recommendation normally when logging fails" do
      elements = [ element(id: 1, team: 1, total_points: 100, points_per_game: "5.0", web_name: "A", starts: 6) ] + filler_elements(10, start_id: 100)
      stub_captain_squad(elements)
      allow(FplClient).to receive(:bootstrap_static).and_return(bootstrap_result(elements: elements))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: []))
      allow(RecommendationLog).to receive(:create!).and_raise(ActiveRecord::StatementInvalid, "db hiccup")
      allow(Rails.logger).to receive(:error)

      result = nil
      expect { result = described_class.suggest_captain(team_id: 1) }.not_to raise_error

      expect(result[:recommendation]).to eq(player_id: 1, name: "A")
      expect(Rails.logger).to have_received(:error)
    end
  end

  describe ".suggest_transfer" do
    # A bootstrap element for transfer scoring: carries the extra fields
    # (status / now_cost / element_type / selected_by_percent) suggest_transfer reads.
    def bs_element(id:, team:, element_type:, points_per_game:, web_name:, now_cost: 50,
                   status: "a", selected_by_percent: "5.0", starts: 6)
      {
        "id" => id,
        "team" => team,
        "element_type" => element_type,
        "total_points" => 0,
        "points_per_game" => points_per_game,
        "web_name" => web_name,
        "first_name" => web_name,
        "second_name" => "Player",
        "now_cost" => now_cost,
        "status" => status,
        "selected_by_percent" => selected_by_percent,
        "starts" => starts
      }
    end

    def pick_for(element, **overrides)
      SquadAssembler::Pick.new(
        player_id: element["id"],
        name: element["web_name"],
        position: "MID",
        is_captain: false,
        is_vice_captain: false,
        now_cost: element["now_cost"],
        element_type: element["element_type"],
        **overrides
      )
    end

    def squad_for(picks, bank: 0, data_as_of: nil, stale: false)
      SquadAssembler::Squad.new(
        picks: picks, formation: "4-4-2", bank: bank,
        current_event: 7, data_as_of: data_as_of, stale: stale
      )
    end

    def stub_sources(squad:, elements:, fixtures: [], bootstrap_stale: false, bootstrap_fetched_at: Time.zone.now)
      allow(SquadAssembler).to receive(:for).and_return(squad)
      allow(FplClient).to receive(:bootstrap_static)
        .and_return(bootstrap_result(elements: elements, stale: bootstrap_stale, fetched_at: bootstrap_fetched_at))
      allow(FplClient).to receive(:fixtures).and_return(fixtures_result(fixtures: fixtures))
    end

    # Owned filler players (bench fodder) so the squad has a realistic size without
    # affecting which swap wins.
    def owned_filler(count, start_id:)
      Array.new(count) do |i|
        bs_element(id: start_id + i, team: 90, element_type: 2, points_per_game: "1.0",
                   web_name: "Owned#{i}", now_cost: 40)
      end
    end

    it "picks the max-gain {player_out, player_in} pair and orders alternatives by gain" do
      out_weak = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "OutWeak", now_cost: 60)
      owned = [ out_weak ] + owned_filler(14, start_id: 100)

      in_best = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "8.0", web_name: "InBest", now_cost: 60)
      in_mid = bs_element(id: 501, team: 2, element_type: 3, points_per_game: "6.0", web_name: "InMid", now_cost: 60)
      in_low = bs_element(id: 502, team: 2, element_type: 3, points_per_game: "4.0", web_name: "InLow", now_cost: 60)

      elements = owned + [ in_best, in_mid, in_low ]
      # No fixtures -> fdr 5 for everyone -> score = ppg * 1 / 5
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: elements)

      result = described_class.suggest_transfer(team_id: 42)

      expect(result[:recommendation]).to eq(
        player_out: { player_id: 1, name: "OutWeak" },
        player_in: { player_id: 500, name: "InBest" }
      )
      alt_ins = result[:alternatives].map { |a| a[:option][:player_in][:player_id] }
      expect(alt_ins.first(2)).to eq([ 501, 502 ])
      expect(result[:alternatives].first[:why_not_top_pick]).to include("Lower projected gain")

      alt_factors = result[:alternatives].first[:reasoning].map { |r| r[:factor] }
      expect(alt_factors).to eq(%w[recent_form fixture_difficulty expected_gain])
      result[:alternatives].first[:reasoning].each do |entry|
        expect(entry).to include(:factor, :detail, :sample_size)
        expect(entry[:sample_size]).to be_a(Integer)
      end
    end

    it "returns the exact RecommendationContract keys (no :relaxations)" do
      out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
      owned = [ out ] + owned_filler(14, start_id: 100)
      candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "9.0", web_name: "Cand", now_cost: 60)
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ candidate ])

      result = described_class.suggest_transfer(team_id: 1)

      expect(result.keys).to match_array(%i[recommendation confidence reasoning alternatives data_as_of])
    end

    describe "reasoning[]" do
      def reasoning_scenario(risk_tolerance: "balanced", candidate_ownership: "8.3", candidate_cost: 60, bank: 0)
        out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
        owned = [ out ] + owned_filler(14, start_id: 100)
        candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "8.0",
                               web_name: "Cand", now_cost: candidate_cost, selected_by_percent: candidate_ownership)
        stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: bank), elements: owned + [ candidate ])
        described_class.suggest_transfer(team_id: 1, risk_tolerance: risk_tolerance)
      end

      it "always includes the 5 always-on factors, each with factor/detail/integer sample_size" do
        result = reasoning_scenario

        factors = result[:reasoning].map { |r| r[:factor] }
        expect(factors).to include("recent_form", "fixture_difficulty", "expected_gain", "transfer_cost", "affordability")
        result[:reasoning].each do |entry|
          expect(entry[:factor]).to be_a(String)
          expect(entry[:detail]).to be_a(String)
          expect(entry[:sample_size]).to be_a(Integer)
        end
      end

      it "sets recent_form sample_size to the player_in's qualifying gameweeks" do
        result = reasoning_scenario
        recent_form = result[:reasoning].find { |r| r[:factor] == "recent_form" }
        expect(recent_form[:sample_size]).to eq(6)
      end

      it "includes the ownership factor for safe (unrelaxed)" do
        result = reasoning_scenario(risk_tolerance: "safe", candidate_ownership: "20.0")
        ownership = result[:reasoning].find { |r| r[:factor] == "ownership" }
        expect(ownership[:detail]).to include("widely-owned safe pick")
      end

      it "includes the ownership factor for differential (unrelaxed)" do
        result = reasoning_scenario(risk_tolerance: "differential", candidate_ownership: "8.3")
        ownership = result[:reasoning].find { |r| r[:factor] == "ownership" }
        expect(ownership[:detail]).to include("differential pick")
      end

      it "omits the ownership factor for balanced" do
        result = reasoning_scenario(risk_tolerance: "balanced")
        expect(result[:reasoning].map { |r| r[:factor] }).not_to include("ownership")
      end

      it "omits the ownership factor when the risk filter was relaxed" do
        result = reasoning_scenario(risk_tolerance: "safe", candidate_ownership: "3.0")
        factors = result[:reasoning].map { |r| r[:factor] }
        expect(factors).not_to include("ownership")
        expect(factors).to include("candidate_pool")
      end

      it "omits the candidate_pool note when no relaxation fired" do
        result = reasoning_scenario
        expect(result[:reasoning].map { |r| r[:factor] }).not_to include("candidate_pool")
      end

      it "adds a candidate_pool note mentioning the budget when affordability was relaxed" do
        out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 40)
        owned = [ out ] + owned_filler(14, start_id: 100)
        dear_cand = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "8.0",
                               web_name: "Dear", now_cost: 130, selected_by_percent: "3.0")
        stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ dear_cand ])

        result = described_class.suggest_transfer(team_id: 1, risk_tolerance: "safe")

        note = result[:reasoning].find { |r| r[:factor] == "candidate_pool" }
        expect(note[:detail]).to include("widened the search")
        expect(note[:detail]).to include("budget")
        expect(note[:sample_size]).to eq(1)
      end
    end

    describe "confidence via RecommendationContract.confidence_for on the player_in sample" do
      def confidence_scenario(in_starts:)
        out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
        owned = [ out ] + owned_filler(14, start_id: 100)
        candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "8.0",
                               web_name: "Cand", now_cost: 60, starts: in_starts)
        stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ candidate ])
        described_class.suggest_transfer(team_id: 1)[:confidence]
      end

      it "is low below LOW_CONFIDENCE_MAX_GAMEWEEKS" do
        expect(confidence_scenario(in_starts: 2)).to eq(RecommendationContract.confidence_for(2))
        expect(confidence_scenario(in_starts: 2)).to eq("low")
      end

      it "is medium within the medium band" do
        expect(confidence_scenario(in_starts: 5)).to eq(RecommendationContract.confidence_for(5))
        expect(confidence_scenario(in_starts: 5)).to eq("medium")
      end

      it "is high at or above HIGH_CONFIDENCE_MIN_GAMEWEEKS" do
        expect(confidence_scenario(in_starts: 15)).to eq(RecommendationContract.confidence_for(15))
        expect(confidence_scenario(in_starts: 15)).to eq("high")
      end
    end

    describe "BL-002 logging" do
      def log_scenario
        out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
        owned = [ out ] + owned_filler(14, start_id: 100)
        candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "8.0", web_name: "Cand", now_cost: 60)
        stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ candidate ])
      end

      it "writes one transfer row per call with the out/in ids and formula version" do
        log_scenario
        expect { described_class.suggest_transfer(team_id: 42) }.to change(RecommendationLog, :count).by(1)

        log = RecommendationLog.last
        expect(log.recommendation_type).to eq("transfer")
        expect(log.player_out_id).to eq(1)
        expect(log.player_id).to eq(500)
        expect(log.team_id).to eq("42")
        expect(log.gameweek).to eq(7)
        expect(log.formula_version).to eq(RecommendationBuilder::TRANSFER_FORMULA_VERSION)
      end

      it "swallows a logging failure and still returns the recommendation" do
        log_scenario
        allow(RecommendationLog).to receive(:create!).and_raise(ActiveRecord::StatementInvalid, "db hiccup")
        allow(Rails.logger).to receive(:error)

        result = nil
        expect { result = described_class.suggest_transfer(team_id: 1) }.not_to raise_error
        expect(result[:recommendation][:player_in][:player_id]).to eq(500)
        expect(Rails.logger).to have_received(:error)
      end
    end

    it "does not rescue FplClient::UnavailableError from bootstrap_static" do
      allow(SquadAssembler).to receive(:for).and_return(
        squad_for(owned_filler(15, start_id: 100).map { |e| pick_for(e) }, bank: 0)
      )
      allow(FplClient).to receive(:bootstrap_static).and_raise(FplClient::UnavailableError, "no data")

      expect { described_class.suggest_transfer(team_id: 1) }.to raise_error(FplClient::UnavailableError)
    end

    describe "risk_tolerance ownership filter" do
      def scenario(candidate_ownership:)
        out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
        owned = [ out ] + owned_filler(14, start_id: 100)
        candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "9.0",
                               web_name: "Cand", now_cost: 60, selected_by_percent: candidate_ownership)
        stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ candidate ])
      end

      it "includes a 15.0% candidate for safe and excludes 14.99%" do
        scenario(candidate_ownership: "15.0")
        expect(described_class.suggest_transfer(team_id: 1, risk_tolerance: "safe")[:recommendation][:player_in][:player_id]).to eq(500)

        scenario(candidate_ownership: "14.99")
        result = described_class.suggest_transfer(team_id: 1, risk_tolerance: "safe")
        expect(result[:recommendation][:player_in][:player_id]).to eq(500)
        expect(result[:reasoning].map { |r| r[:factor] }).to include("candidate_pool")
      end

      it "includes a 10.0% candidate for differential and excludes 10.01%" do
        scenario(candidate_ownership: "10.0")
        expect(described_class.suggest_transfer(team_id: 1, risk_tolerance: "differential")[:recommendation][:player_in][:player_id]).to eq(500)

        scenario(candidate_ownership: "10.01")
        result = described_class.suggest_transfer(team_id: 1, risk_tolerance: "differential")
        expect(result[:reasoning].map { |r| r[:factor] }).to include("candidate_pool")
      end

      it "applies no ownership filter for balanced" do
        scenario(candidate_ownership: "0.5")
        result = described_class.suggest_transfer(team_id: 1, risk_tolerance: "balanced")
        expect(result[:recommendation][:player_in][:player_id]).to eq(500)
        expect(result[:reasoning].map { |r| r[:factor] }).not_to include("candidate_pool")
      end
    end

    it "never selects an injured (status i) player_in but allows a doubtful (status d) one" do
      out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
      owned = [ out ] + owned_filler(14, start_id: 100)
      injured = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "9.0", web_name: "Injured", now_cost: 40, status: "i")
      doubtful = bs_element(id: 501, team: 2, element_type: 3, points_per_game: "6.0", web_name: "Doubtful", now_cost: 40, status: "d")
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ injured, doubtful ])

      result = described_class.suggest_transfer(team_id: 1)

      expect(result[:recommendation][:player_in][:player_id]).to eq(501)
    end

    it "forces an owned status-i player's score to 0 so it is selected as player_out" do
      injured_star = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "9.0", web_name: "InjuredStar", now_cost: 60, status: "i")
      healthy_owned = bs_element(id: 2, team: 3, element_type: 3, points_per_game: "7.0", web_name: "Healthy", now_cost: 60)
      owned = [ injured_star, healthy_owned ] + owned_filler(13, start_id: 100)
      candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "5.0", web_name: "Cand", now_cost: 60)
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ candidate ])

      result = described_class.suggest_transfer(team_id: 1)

      expect(result[:recommendation][:player_out][:player_id]).to eq(1)
      expect(result[:recommendation][:player_in][:player_id]).to eq(500)
    end

    it "allows a player_in costing exactly bank + player_out.now_cost but not one costing 1 more" do
      out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
      owned = [ out ] + owned_filler(14, start_id: 100)
      exact = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "9.0", web_name: "Exact", now_cost: 70)
      too_dear = bs_element(id: 501, team: 2, element_type: 3, points_per_game: "9.5", web_name: "TooDear", now_cost: 71)
      # bank 10 + out 60 = 70
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 10), elements: owned + [ exact, too_dear ])

      result = described_class.suggest_transfer(team_id: 1)

      expect(result[:recommendation][:player_in][:player_id]).to eq(500)
    end

    it "records the relaxation and still returns a pair when the risk filter empties the pool" do
      out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
      owned = [ out ] + owned_filler(14, start_id: 100)
      low_owned_cand = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "8.0",
                                  web_name: "Cand", now_cost: 60, selected_by_percent: "3.0")
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ low_owned_cand ])

      result = described_class.suggest_transfer(team_id: 1, risk_tolerance: "safe")

      note = result[:reasoning].find { |r| r[:factor] == "candidate_pool" }
      expect(note[:detail]).to eq("No candidate matched the requested risk profile; widened the search")
      expect(result[:recommendation][:player_in][:player_id]).to eq(500)
    end

    it "still returns a {player_out, player_in} pair when the best gain is non-positive" do
      out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "9.0", web_name: "StrongOut", now_cost: 60)
      owned = [ out ] + owned_filler(14, start_id: 100)
      weak_cand = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "1.0", web_name: "WeakCand", now_cost: 60)
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ weak_cand ])

      result = described_class.suggest_transfer(team_id: 1)

      expect(result[:recommendation]).to eq(
        player_out: { player_id: 1, name: "StrongOut" },
        player_in: { player_id: 500, name: "WeakCand" }
      )
    end

    it "exposes TRANSFER_FORMULA_VERSION" do
      expect(RecommendationBuilder::TRANSFER_FORMULA_VERSION).to eq("v1-transfer-form-fdr-own")
    end

    it "sets data_as_of from a stale source" do
      out = bs_element(id: 1, team: 1, element_type: 3, points_per_game: "2.0", web_name: "Out", now_cost: 60)
      owned = [ out ] + owned_filler(14, start_id: 100)
      candidate = bs_element(id: 500, team: 2, element_type: 3, points_per_game: "9.0", web_name: "Cand", now_cost: 60)
      stale_time = 2.hours.ago
      stub_sources(squad: squad_for(owned.map { |e| pick_for(e) }, bank: 0), elements: owned + [ candidate ],
                   bootstrap_stale: true, bootstrap_fetched_at: stale_time)

      result = described_class.suggest_transfer(team_id: 1)

      expect(result[:data_as_of]).to eq(stale_time.iso8601)
    end

    it "does not rescue FplClient::NotFoundError from SquadAssembler" do
      allow(SquadAssembler).to receive(:for).and_raise(FplClient::NotFoundError, "no such team")

      expect { described_class.suggest_transfer(team_id: 1) }.to raise_error(FplClient::NotFoundError)
    end
  end
end
