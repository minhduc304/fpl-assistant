import { notFound } from "next/navigation";
import type { components } from "@fpl-assistant/api-client";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ReasoningList } from "@/components/reasoning-list";
import { RecommendedPlayer } from "@/components/recommended-player";

type Player = components["schemas"]["Player"];

interface PlayerRef {
  player_id: number;
  name: string;
}

async function fetchPlayerOrNull(playerId: number): Promise<Player | null> {
  try {
    return await callRailsApi((client) =>
      client.GET("/players/{playerId}", { params: { path: { playerId } } })
    );
  } catch {
    return null;
  }
}

export default async function CaptainSuggestionPage({ params }: PageProps<"/teams/[teamId]/captain">) {
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId)) {
    notFound();
  }

  let result;
  try {
    result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/suggest-captain", { params: { path: { teamId } } })
    );
  } catch (error) {
    if (error instanceof RailsApiError) {
      if (error.status === 404) {
        notFound();
      }
      if (error.status === 503 || error.status === 429) {
        return (
          <div className="flex flex-1 items-center justify-center px-5 py-16">
            <main className="w-full max-w-sm">
              <div
                role="alert"
                className="rounded-md border px-2.5 py-2 text-sm"
                style={{
                  color: "var(--destructive)",
                  backgroundColor: "var(--destructive-dim)",
                  borderColor: "var(--destructive)",
                }}
              >
                We can&apos;t get a captain suggestion right now. Try again in a few minutes.
              </div>
            </main>
          </div>
        );
      }
    }
    throw error;
  }

  const top = result.recommendation as unknown as PlayerRef;
  const alternatives = result.alternatives ?? [];

  const [topPlayer, ...altPlayers] = await Promise.all([
    fetchPlayerOrNull(top.player_id),
    ...alternatives.map((alt) => fetchPlayerOrNull((alt.option as unknown as PlayerRef).player_id)),
  ]);

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-3xl flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Captain suggestion</h1>
          {result.data_as_of ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Data as of <span className="font-numeral tabular-nums">{formatDataAsOfTime(result.data_as_of)}</span>
            </p>
          ) : null}
        </div>

        <section
          className="flex flex-col gap-5 rounded-lg border p-6"
          style={{ borderColor: "var(--border-strong)", backgroundColor: "var(--card)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <RecommendedPlayer name={top.name} player={topPlayer} />
            <ConfidenceBadge confidence={result.confidence} />
          </div>
          <ReasoningList reasoning={result.reasoning} />
        </section>

        {alternatives.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Alternatives
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {alternatives.map((alt, i) => {
                const ref = alt.option as unknown as PlayerRef;
                return (
                  <div
                    key={ref.player_id ?? i}
                    className="flex flex-col gap-4 rounded-lg border p-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <RecommendedPlayer name={ref.name} player={altPlayers[i]} />
                    <ReasoningList reasoning={alt.reasoning} />
                    <p
                      className="text-sm text-[var(--muted-foreground)] pt-3 border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span className="font-medium text-[var(--foreground)]">Why not the top pick: </span>
                      {alt.why_not_top_pick}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
