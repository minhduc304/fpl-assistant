import Link from "next/link";
import { notFound } from "next/navigation";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";
import { LeagueIdForm } from "@/components/league-id-form";

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

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-md flex flex-col gap-7">
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

        <Link
          href={`/teams/${teamId}/squad`}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-lg text-base font-semibold transition-[filter] duration-100 hover:brightness-[1.06] active:brightness-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          View squad
        </Link>

        <LeagueIdForm teamId={teamId} />
      </main>
    </div>
  );
}
