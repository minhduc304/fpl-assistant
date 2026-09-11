Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # openapi.yaml: GET /teams/{teamId}/suggest-captain (Recommendations tag)
  get "teams/:team_id/suggest-captain" => "captain_suggestions#show"

  # openapi.yaml: GET /teams/{teamId}/squad (Team tag)
  get "teams/:team_id/squad" => "squads#show"

  # openapi.yaml: GET /teams/{teamId}/suggest-transfer (Recommendations tag)
  get "teams/:team_id/suggest-transfer" => "transfer_suggestions#show"

  # More specific `compare` line first for clarity (Rails matches full path
  # segments, so bare `teams/:team_id` does not shadow the nested routes above).
  get "teams/:team_id/compare/:rival_team_id" => "team_comparisons#show"  # openapi.yaml: GET /teams/{teamId}/compare/{rivalTeamId} (MiniLeague tag)
  get "teams/:team_id/charts" => "charts#show"                           # openapi.yaml: GET /teams/{teamId}/charts (Charts tag)
  get "teams/:team_id" => "teams#show"                                   # openapi.yaml: GET /teams/{teamId} (Team tag)

  # openapi.yaml: GET /mini-leagues/{leagueId}/standings (MiniLeague tag)
  get "mini-leagues/:league_id/standings" => "mini_leagues#standings"

  # These three MUST stay in this order — Rails matches top-down, so the
  # `compare` and collection routes must precede `:player_id` or they get shadowed.
  get "players/compare" => "players#compare"     # openapi.yaml: GET /players/compare (Players tag)
  get "players" => "players#index"               # openapi.yaml: GET /players (Players tag)
  get "players/:player_id" => "players#show"     # openapi.yaml: GET /players/{playerId} (Players tag)

  # openapi.yaml: GET /fixtures (Fixtures tag)
  get "fixtures" => "fixtures#index"

  # Defines the root path route ("/")
  # root "posts#index"
end
