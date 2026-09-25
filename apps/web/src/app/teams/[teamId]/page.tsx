import Link from "next/link";
import { notFound } from "next/navigation";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";
import { LeagueIdForm } from "@/components/league-id-form";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ReasoningList } from "@/components/reasoning-list";
import {
  fetchSquadPreview,
  fetchCaptainPreview,
  fetchTransferPreview,
  fetchFixturesPreview,
  fetchChartPreview,
} from "@/lib/team-dashboard";

function DashboardCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {title}
      </h2>
      <div className="flex flex-1 flex-col gap-2 text-sm">{children}</div>
      <Link
        href={href}
        className="mt-1 text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        View details →
      </Link>
    </div>
  );
}

function CardUnavailable() {
  return <p className="text-[var(--muted-foreground)]">Not available right now.</p>;
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 200;
  const height = 40;
  const step = width / (points.length - 1);
  const path = points
    .map((y, i) => `${i === 0 ? "M" : "L"}${i * step},${height - ((y - min) / range) * height}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full" aria-hidden="true">
      <path d={path} fill="none" stroke="var(--foreground)" strokeWidth="1.5" />
    </svg>
  );
}

export default async function TeamOverviewPage({ params }: PageProps<"/teams/[teamId]">) {
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId)) {
    notFound();
  }

  let team;
  try {
    team = await callRailsApi((client) =>
      client.GET("/teams/{teamId}", { params: { path: { teamId } } })
    );
  } catch (error) {
    if (error instanceof RailsApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const [squadPreview, captainPreview, transferPreview, fixturesPreview, chartPreview] = await Promise.all([
    fetchSquadPreview(teamId),
    fetchCaptainPreview(teamId),
    fetchTransferPreview(teamId),
    fetchFixturesPreview(),
    fetchChartPreview(teamId),
  ]);

  return (
    <div className="flex flex-1 justify-center px-5 py-16">
      <main className="w-full max-w-3xl flex flex-col gap-8">
        <h1 className="text-xl font-semibold">{team.name}</h1>

        <dl className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Manager</dt>
            <dd className="text-base">{team.manager_name}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Overall rank</dt>
            <dd className="font-numeral text-base tabular-nums">
              {team.overall_rank != null ? team.overall_rank.toLocaleString("en-GB") : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Total points</dt>
            <dd className="font-numeral text-base tabular-nums">{team.total_points ?? "—"}</dd>
          </div>
        </dl>

        {team.stale && team.data_as_of ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Data as of <span className="font-numeral tabular-nums">{formatDataAsOfTime(team.data_as_of)}</span>
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardCard title="Squad" href={`/teams/${teamId}/squad`}>
            {squadPreview ? (
              <>
                <p className="font-numeral text-base tabular-nums">{squadPreview.formation}</p>
                <p className="text-[var(--muted-foreground)]">
                  {squadPreview.picks.length} players · Captain:{" "}
                  {squadPreview.picks.find((p) => p.is_captain)?.name ?? "—"}
                </p>
              </>
            ) : (
              <CardUnavailable />
            )}
          </DashboardCard>

          <DashboardCard title="Captain suggestion" href={`/teams/${teamId}/captain`}>
            {captainPreview ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold">{captainPreview.name}</span>
                  <ConfidenceBadge confidence={captainPreview.confidence} />
                </div>
                <ReasoningList reasoning={captainPreview.reasoning} />
              </>
            ) : (
              <CardUnavailable />
            )}
          </DashboardCard>

          <DashboardCard title="Transfer suggestion" href={`/teams/${teamId}/transfer`}>
            {transferPreview ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">
                    {transferPreview.out} <span className="text-[var(--muted-foreground)]">→</span>{" "}
                    {transferPreview.in}
                  </span>
                  <ConfidenceBadge confidence={transferPreview.confidence} />
                </div>
                <ReasoningList reasoning={transferPreview.reasoning} />
              </>
            ) : (
              <CardUnavailable />
            )}
          </DashboardCard>

          <DashboardCard title="Fixtures" href={`/teams/${teamId}/fixtures`}>
            {fixturesPreview && fixturesPreview.gameweek != null ? (
              <p className="text-[var(--muted-foreground)]">
                Next: Gameweek{" "}
                <span className="font-numeral tabular-nums text-[var(--foreground)]">
                  {fixturesPreview.gameweek}
                </span>{" "}
                · {fixturesPreview.fixtures.length} fixture{fixturesPreview.fixtures.length === 1 ? "" : "s"}
              </p>
            ) : (
              <CardUnavailable />
            )}
          </DashboardCard>

          <DashboardCard title="Charts" href={`/teams/${teamId}/charts`}>
            {chartPreview ? (
              <>
                <Sparkline points={chartPreview.points} />
                <p className="text-[var(--muted-foreground)]">
                  Latest: <span className="font-numeral tabular-nums text-[var(--foreground)]">
                    {Math.round(chartPreview.latest)}
                  </span>{" "}
                  pts/gameweek
                </p>
              </>
            ) : (
              <CardUnavailable />
            )}
          </DashboardCard>
        </div>

        <LeagueIdForm teamId={teamId} />
      </main>
    </div>
  );
}
