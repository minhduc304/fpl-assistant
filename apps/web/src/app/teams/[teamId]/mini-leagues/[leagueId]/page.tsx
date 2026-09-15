import Link from "next/link";
import { notFound } from "next/navigation";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";

export default async function MiniLeagueStandingsPage({
  params,
}: PageProps<"/teams/[teamId]/mini-leagues/[leagueId]">) {
  const { teamId: teamIdParam, leagueId: leagueIdParam } = await params;
  const teamId = Number(teamIdParam);
  const leagueId = Number(leagueIdParam);
  if (!Number.isInteger(teamId) || !Number.isInteger(leagueId)) {
    notFound();
  }

  let result;
  try {
    result = await callRailsApi((client) =>
      client.GET("/mini-leagues/{leagueId}/standings", { params: { path: { leagueId } } })
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
                We can&apos;t get standings right now. Try again in a few minutes.
              </div>
            </main>
          </div>
        );
      }
    }
    throw error;
  }

  const standings = result.standings ?? [];

  return (
    <div className="flex flex-1 justify-center px-5 py-16">
      <main className="w-full max-w-2xl flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <Link
            href={`/teams/${teamId}`}
            aria-label={`Back to team overview`}
            className="w-fit text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            ← Team overview
          </Link>
          <h1 className="text-xl font-semibold">{result.league_name ?? "Mini-league standings"}</h1>
        </div>

        {result.stale && result.data_as_of ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Data as of{" "}
            <span className="font-numeral tabular-nums">{formatDataAsOfTime(result.data_as_of)}</span>
          </p>
        ) : null}

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Mini-league standings by rank</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4 pl-3">
                  Rank
                </th>
                <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4">
                  Team
                </th>
                <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4">
                  Total points
                </th>
                <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {standings.map((entry) => {
                const isYou = entry.team_id === teamId;
                return (
                  <tr
                    key={entry.team_id}
                    className="border-t"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: isYou ? "var(--card)" : undefined,
                      borderLeftColor: isYou ? "var(--primary)" : "transparent",
                      borderLeftWidth: "2px",
                    }}
                  >
                    <td className="py-2 pr-4 pl-3 font-numeral tabular-nums">{entry.rank}</td>
                    <td className="py-2 pr-4">
                      {entry.team_name}
                      {isYou ? (
                        <span className="ml-2 text-xs font-semibold" style={{ color: "var(--primary)" }}>
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-4 font-numeral tabular-nums">{entry.total_points}</td>
                    <td className="py-2 pr-4">
                      {!isYou && entry.team_id != null ? (
                        <Link
                          href={`/teams/${teamId}/compare/${entry.team_id}`}
                          aria-label={`Compare against ${entry.team_name}`}
                          className="text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                        >
                          Compare
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:hidden">
          {standings.map((entry) => {
            const isYou = entry.team_id === teamId;
            return (
              <div
                key={entry.team_id}
                className="flex flex-col gap-2 rounded-lg border p-4"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: isYou ? "var(--card)" : undefined,
                  borderLeftColor: isYou ? "var(--primary)" : "var(--border)",
                  borderLeftWidth: isYou ? "2px" : "1px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-numeral tabular-nums text-sm">#{entry.rank}</span>
                  {isYou ? (
                    <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      You
                    </span>
                  ) : null}
                </div>
                <dl className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted-foreground)]">Team</dt>
                    <dd>{entry.team_name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted-foreground)]">Total points</dt>
                    <dd className="font-numeral tabular-nums">{entry.total_points}</dd>
                  </div>
                </dl>
                {!isYou && entry.team_id != null ? (
                  <Link
                    href={`/teams/${teamId}/compare/${entry.team_id}`}
                    aria-label={`Compare against ${entry.team_name}`}
                    className="text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  >
                    Compare
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
