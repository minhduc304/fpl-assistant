import Link from "next/link";
import { notFound } from "next/navigation";
import type { components } from "@fpl-assistant/api-client";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";

type Team = components["schemas"]["Team"];

export default async function CompareRivalTeamPage({
  params,
}: PageProps<"/teams/[teamId]/compare/[rivalTeamId]">) {
  const { teamId: teamIdParam, rivalTeamId: rivalTeamIdParam } = await params;
  const teamId = Number(teamIdParam);
  const rivalTeamId = Number(rivalTeamIdParam);
  if (!Number.isInteger(teamId) || !Number.isInteger(rivalTeamId)) {
    notFound();
  }

  let result;
  try {
    result = await callRailsApi((client) =>
      client.GET("/teams/{teamId}/compare/{rivalTeamId}", { params: { path: { teamId, rivalTeamId } } })
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
                We can&apos;t get this comparison right now. Try again in a few minutes.
              </div>
            </main>
          </div>
        );
      }
    }
    throw error;
  }

  const teams = [result.team, result.rival_team].filter((t): t is Team => t != null);
  const isStale = result.stale && result.data_as_of;

  const rows: { label: string; render: (t: Team) => string }[] = [
    { label: "Manager", render: (t) => t.manager_name ?? "—" },
    {
      label: "Overall rank",
      render: (t) => (t.overall_rank != null ? t.overall_rank.toLocaleString("en-GB") : "—"),
    },
    { label: "Total points", render: (t) => (t.total_points != null ? String(t.total_points) : "—") },
  ];

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-2xl flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <Link
            href={`/teams/${teamId}`}
            className="w-fit text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            ← League standings
          </Link>
          <h1 className="text-xl font-semibold">Compare teams</h1>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Side-by-side comparison for the selected teams</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4" />
                {teams.map((t) => (
                  <th key={t.team_id} scope="col" className="text-left font-medium py-2 pr-4">
                    {t.name ?? "—"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <th scope="row" className="text-left font-normal text-[var(--muted-foreground)] py-2 pr-4">
                    {row.label}
                  </th>
                  {teams.map((t) => (
                    <td key={t.team_id} className="font-numeral tabular-nums py-2 pr-4">
                      {row.render(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-6 sm:hidden">
          {teams.map((t) => (
            <div key={t.team_id} className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">{t.name ?? "—"}</h2>
              <dl className="flex flex-col gap-2">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-[var(--muted-foreground)]">{row.label}</dt>
                    <dd className="font-numeral text-sm tabular-nums">{row.render(t)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {isStale ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Data as of <span className="font-numeral tabular-nums">{formatDataAsOfTime(result.data_as_of!)}</span>
          </p>
        ) : null}
      </main>
    </div>
  );
}
