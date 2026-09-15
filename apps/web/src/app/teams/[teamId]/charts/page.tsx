import { Suspense } from "react";
import { notFound } from "next/navigation";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { TeamAreaChart } from "@/components/charts/team-area-chart";

type ChartType = "points_per_gameweek" | "rank_trajectory" | "price_history";

const CHART_META: Record<ChartType, { label: string; subject: string }> = {
  points_per_gameweek: { label: "Points per gameweek", subject: "Points per gameweek" },
  rank_trajectory: { label: "Rank trajectory", subject: "Overall rank" },
  price_history: { label: "Price history", subject: "Squad value" },
};

function formatValue(type: ChartType, value: number): string {
  if (type === "price_history") return `£${value.toFixed(1)}`;
  return String(Math.round(value));
}

function summarize(type: ChartType, points: { x: number; y: number }[]): string {
  const first = points[0].y;
  const latest = points[points.length - 1].y;
  const firstRounded = type === "price_history" ? Math.round(first * 10) : Math.round(first);
  const latestRounded = type === "price_history" ? Math.round(latest * 10) : Math.round(latest);

  let direction: "up" | "down" | "flat";
  if (firstRounded === latestRounded) {
    direction = "flat";
  } else if (type === "rank_trajectory") {
    // Lower rank number is better — "up" means improving, matching the chart's inverted y-axis.
    direction = latestRounded < firstRounded ? "up" : "down";
  } else {
    direction = latestRounded > firstRounded ? "up" : "down";
  }

  const { subject } = CHART_META[type];
  return `${subject}: started at ${formatValue(type, first)}, most recently ${formatValue(type, latest)}, generally trending ${direction}.`;
}

async function ChartSection({ teamId, type }: { teamId: number; type: ChartType }) {
  const meta = CHART_META[type];
  let points: { x: number; y: number }[];
  try {
    const result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/charts", { params: { path: { teamId }, query: { type } } })
    );
    points = (result.points ?? [])
      .filter((p): p is { x: number; y: number } => p.x != null && p.y != null)
      .map((p) => ({ x: p.x, y: p.y }));
  } catch {
    return (
      <section aria-labelledby={`${type}-heading`} className="flex flex-col gap-3">
        <h2 id={`${type}-heading`} className="text-base font-semibold">
          {meta.label}
        </h2>
        <p role="alert" className="text-sm" style={{ color: "var(--destructive)" }}>
          Can&apos;t load this chart right now.
        </p>
      </section>
    );
  }

  if (points.length === 0) {
    return (
      <section aria-labelledby={`${type}-heading`} className="flex flex-col gap-3">
        <h2 id={`${type}-heading`} className="text-base font-semibold">
          {meta.label}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">No data yet.</p>
      </section>
    );
  }

  // Rank trajectory plots inverted (rank 1 at top) so "line going up" means "improving"
  // on every chart, not just two of three — the summary text applies the same inversion.
  const chartPoints = type === "rank_trajectory" ? points.map((p) => ({ x: p.x, y: -p.y })) : points;

  return (
    <section aria-labelledby={`${type}-heading`} className="flex flex-col gap-3">
      <h2 id={`${type}-heading`} className="text-base font-semibold">
        {meta.label}
      </h2>
      <TeamAreaChart points={chartPoints} />
      <p className="sr-only">{summarize(type, points)}</p>
    </section>
  );
}

function ChartFallback({ label }: { label: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{label}</h2>
      <p className="text-sm text-[var(--muted-foreground)]">Loading {label.toLowerCase()}…</p>
    </section>
  );
}

export default async function ChartsPage({ params }: PageProps<"/teams/[teamId]/charts">) {
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId)) {
    notFound();
  }

  try {
    await callRailsApi((client) => client.GET("/teams/{teamId}", { params: { path: { teamId } } }));
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
                We can&apos;t get chart data right now. Try again in a few minutes.
              </div>
            </main>
          </div>
        );
      }
    }
    throw error;
  }

  const types: ChartType[] = ["points_per_gameweek", "rank_trajectory", "price_history"];

  return (
    <div className="flex flex-1 justify-center px-5 py-16">
      <main className="w-full max-w-3xl flex flex-col gap-10">
        <h1 className="text-xl font-semibold">Charts</h1>
        {types.map((type) => (
          <Suspense key={type} fallback={<ChartFallback label={CHART_META[type].label} />}>
            <ChartSection teamId={teamId} type={type} />
          </Suspense>
        ))}
      </main>
    </div>
  );
}
