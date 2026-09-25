import { callRailsApi } from "@/lib/api";
import type { components } from "@fpl-assistant/api-client";

type SquadPick = components["schemas"]["SquadPick"];
type Fixture = components["schemas"]["Fixture"];
type MiniLeagueEntry = components["schemas"]["MiniLeagueEntry"];

interface PlayerRef {
  player_id: number;
  name: string;
}

interface SwapRef {
  player_out: PlayerRef;
  player_in: PlayerRef;
}

export async function fetchSquadPreview(teamId: number) {
  try {
    const squad = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/squad", { params: { path: { teamId } } })
    );
    const picks = squad.picks ?? [];
    const starting = picks.filter((p) => p.is_starting);
    const formation = ["DEF", "MID", "FWD"]
      .map((pos) => starting.filter((p) => p.position === pos).length)
      .join("-");
    return { formation, picks, startingCount: starting.length };
  } catch {
    return null;
  }
}

export async function fetchCaptainPreview(teamId: number) {
  try {
    const result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/suggest-captain", { params: { path: { teamId } } })
    );
    const top = result.recommendation as unknown as PlayerRef;
    return { name: top.name, confidence: result.confidence, reasoning: result.reasoning ?? [] };
  } catch {
    return null;
  }
}

export async function fetchTransferPreview(teamId: number) {
  try {
    const result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/suggest-transfer", {
        params: { path: { teamId }, query: { risk_tolerance: "balanced" } },
      })
    );
    const top = result.recommendation as unknown as SwapRef;
    return {
      out: top.player_out.name,
      in: top.player_in.name,
      confidence: result.confidence,
      reasoning: result.reasoning ?? [],
    };
  } catch {
    return null;
  }
}

export async function fetchFixturesPreview() {
  try {
    const result = await callRailsApi((client) => client.GET("/fixtures", { params: { query: {} } }));
    const fixtures = result.fixtures ?? [];
    if (fixtures.length === 0) return { gameweek: null, fixtures: [] as Fixture[] };
    const gameweek = Math.min(...fixtures.map((f) => f.gameweek ?? Infinity));
    return { gameweek, fixtures: fixtures.filter((f) => f.gameweek === gameweek) };
  } catch {
    return null;
  }
}

export async function fetchChartPreview(teamId: number) {
  try {
    const result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/charts", {
        params: { path: { teamId }, query: { type: "points_per_gameweek" } },
      })
    );
    const points = (result.points ?? [])
      .filter((p): p is { x: number; y: number } => p.x != null && p.y != null)
      .map((p) => p.y);
    return points.length > 0 ? { points, latest: points[points.length - 1] } : null;
  } catch {
    return null;
  }
}

export async function fetchRankTrajectoryPreview(teamId: number) {
  try {
    const result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/charts", {
        params: { path: { teamId }, query: { type: "rank_trajectory" } },
      })
    );
    const rawPoints = (result.points ?? []).filter(
      (p): p is { x: number; y: number } => p.x != null && p.y != null
    );
    if (rawPoints.length === 0) return null;
    // Lower rank number is better — invert for display so "line going up" means improving,
    // matching apps/web/src/app/teams/[teamId]/charts/page.tsx's own convention.
    const latest = rawPoints[rawPoints.length - 1].y;
    return { points: rawPoints.map((p) => -p.y), latest };
  } catch {
    return null;
  }
}

export async function fetchStandingsPreview(leagueId: number, teamId: number) {
  try {
    const result = await callRailsApi((client) =>
      client.GET("/mini-leagues/{leagueId}/standings", { params: { path: { leagueId } } })
    );
    const standings = (result.standings ?? []) as MiniLeagueEntry[];
    return { leagueName: result.league_name ?? "Mini-league", standings, teamId };
  } catch {
    return null;
  }
}

export type { SquadPick, Fixture, MiniLeagueEntry };
