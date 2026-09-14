import Link from "next/link";
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

interface SwapRef {
  player_out: PlayerRef;
  player_in: PlayerRef;
}

const RISK_OPTIONS = [
  { value: "safe", label: "Safe" },
  { value: "balanced", label: "Balanced" },
  { value: "differential", label: "Differential" },
] as const;

async function fetchPlayerOrNull(playerId: number): Promise<Player | null> {
  try {
    return await callRailsApi((client) =>
      client.GET("/players/{playerId}", { params: { path: { playerId } } })
    );
  } catch {
    return null;
  }
}

function SwapPair({
  playerOut,
  playerIn,
  outData,
  inData,
}: {
  playerOut: PlayerRef;
  playerIn: PlayerRef;
  outData: Player | null;
  inData: Player | null;
}) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Out</span>
        <RecommendedPlayer name={playerOut.name} player={outData} />
      </div>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)] rotate-90 sm:rotate-0">
        <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">In</span>
        <RecommendedPlayer name={playerIn.name} player={inData} />
      </div>
    </div>
  );
}

export default async function TransferSuggestionPage({
  params,
  searchParams,
}: PageProps<"/teams/[teamId]/transfer">) {
  const { teamId: teamIdParam } = await params;
  const { risk_tolerance } = await searchParams;
  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId)) {
    notFound();
  }

  const riskParam = Array.isArray(risk_tolerance) ? risk_tolerance[0] : risk_tolerance;
  const riskTolerance = RISK_OPTIONS.some((o) => o.value === riskParam)
    ? (riskParam as (typeof RISK_OPTIONS)[number]["value"])
    : "balanced";

  let result;
  try {
    result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/suggest-transfer", {
        params: { path: { teamId }, query: { risk_tolerance: riskTolerance } },
      })
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
                We can&apos;t get a transfer suggestion right now. Try again in a few minutes.
              </div>
            </main>
          </div>
        );
      }
    }
    throw error;
  }

  const top = result.recommendation as unknown as SwapRef;
  const alternatives = result.alternatives ?? [];

  const [topOut, topIn, ...altPlayers] = await Promise.all([
    fetchPlayerOrNull(top.player_out.player_id),
    fetchPlayerOrNull(top.player_in.player_id),
    ...alternatives.flatMap((alt) => {
      const ref = alt.option as unknown as SwapRef;
      return [fetchPlayerOrNull(ref.player_out.player_id), fetchPlayerOrNull(ref.player_in.player_id)];
    }),
  ]);

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-3xl flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Transfer suggestion</h1>
          {result.data_as_of ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Data as of <span className="font-numeral tabular-nums">{formatDataAsOfTime(result.data_as_of)}</span>
            </p>
          ) : null}
        </div>

        <nav aria-label="Risk tolerance" className="flex gap-2">
          {RISK_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/teams/${teamId}/transfer?risk_tolerance=${opt.value}`}
              aria-current={riskTolerance === opt.value ? "page" : undefined}
              className="rounded-full border px-3 py-1.5 text-sm font-medium no-underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              style={
                riskTolerance === opt.value
                  ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderColor: "var(--primary)" }
                  : { color: "var(--foreground)", borderColor: "var(--border-strong)" }
              }
            >
              {opt.label}
            </Link>
          ))}
        </nav>

        <section
          className="flex flex-col gap-5 rounded-lg border p-6"
          style={{ borderColor: "var(--border-strong)", backgroundColor: "var(--card)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <SwapPair playerOut={top.player_out} playerIn={top.player_in} outData={topOut} inData={topIn} />
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
                const ref = alt.option as unknown as SwapRef;
                return (
                  <div
                    key={ref.player_in.player_id ?? i}
                    className="flex flex-col gap-4 rounded-lg border p-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <SwapPair
                      playerOut={ref.player_out}
                      playerIn={ref.player_in}
                      outData={altPlayers[i * 2]}
                      inData={altPlayers[i * 2 + 1]}
                    />
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
