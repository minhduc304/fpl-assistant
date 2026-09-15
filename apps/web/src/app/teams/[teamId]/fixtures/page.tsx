import Link from "next/link";
import { notFound } from "next/navigation";
import type { components } from "@fpl-assistant/api-client";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";

type Fixture = components["schemas"]["Fixture"];
type Player = components["schemas"]["Player"];

async function fetchPlayerOrNull(playerId: number): Promise<Player | null> {
  try {
    return await callRailsApi((client) =>
      client.GET("/players/{playerId}", { params: { path: { playerId } } })
    );
  } catch {
    return null;
  }
}

function DifficultyCell({ difficulty }: { difficulty: number | null | undefined }) {
  if (difficulty == null) {
    return <span className="text-[var(--muted-foreground)]">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-numeral tabular-nums">{difficulty}/5</span>
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-1.5 rounded-[1px]"
            style={{
              backgroundColor: i < difficulty ? "var(--foreground)" : "var(--border-strong)",
            }}
          />
        ))}
      </span>
    </span>
  );
}

function GameweekTag({ fixture }: { fixture: Fixture }) {
  if (fixture.is_double_gameweek) {
    return (
      <span
        className="text-xs text-[var(--muted-foreground)]"
        aria-label="Double gameweek — this team plays more than once"
      >
        ×2 this gameweek
      </span>
    );
  }
  if (fixture.is_blank_gameweek) {
    return (
      <span
        className="text-xs text-[var(--muted-foreground)]"
        aria-label="Blank gameweek — this team has no fixture"
      >
        No fixture
      </span>
    );
  }
  return null;
}

function FixtureRow({ fixture, highlighted }: { fixture: Fixture; highlighted: boolean }) {
  const rowStyle = highlighted
    ? { backgroundColor: "var(--card)", borderLeftColor: "var(--primary)", borderLeftWidth: "2px" }
    : { borderLeftColor: "transparent", borderLeftWidth: "2px" };

  return (
    <tr className="border-t" style={{ borderColor: "var(--border)", ...rowStyle }}>
      <td className="py-2 pr-4 pl-3">
        <span className="font-numeral tabular-nums">{fixture.gameweek}</span>
        <div>
          <GameweekTag fixture={fixture} />
        </div>
      </td>
      <td className="py-2 pr-4">{fixture.home_team ?? <span className="text-[var(--muted-foreground)]">—</span>}</td>
      <td className="py-2 pr-4">{fixture.away_team ?? <span className="text-[var(--muted-foreground)]">—</span>}</td>
      <td className="py-2 pr-4">
        <DifficultyCell difficulty={fixture.difficulty_home} />
      </td>
      <td className="py-2 pr-4">
        <DifficultyCell difficulty={fixture.difficulty_away} />
      </td>
    </tr>
  );
}

function FixtureCard({ fixture, highlighted }: { fixture: Fixture; highlighted: boolean }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-4"
      style={{
        borderColor: "var(--border)",
        backgroundColor: highlighted ? "var(--card)" : undefined,
        borderLeftColor: highlighted ? "var(--primary)" : "var(--border)",
        borderLeftWidth: highlighted ? "2px" : "1px",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-numeral tabular-nums text-sm">GW {fixture.gameweek}</span>
        <GameweekTag fixture={fixture} />
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">Home</dt>
          <dd>{fixture.home_team ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">Away</dt>
          <dd>{fixture.away_team ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">Home difficulty</dt>
          <dd>
            <DifficultyCell difficulty={fixture.difficulty_home} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">Away difficulty</dt>
          <dd>
            <DifficultyCell difficulty={fixture.difficulty_away} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default async function FixturesPage({ params }: PageProps<"/teams/[teamId]/fixtures">) {
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId)) {
    notFound();
  }

  let teamName: string | undefined;
  let squad;
  let fixturesResult;
  try {
    [teamName, squad, fixturesResult] = await Promise.all([
      callRailsApi((client) =>
        client.GET("/teams/{teamId}", { params: { path: { teamId } } })
      ).then((team) => team.name),
      callRailsApi((client) =>
        client.GET("/teams/{teamId}/squad", { params: { path: { teamId } } })
      ),
      callRailsApi((client) => client.GET("/fixtures", { params: { query: {} } })),
    ]);
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
                We can&apos;t get fixture data right now. Try again in a few minutes.
              </div>
            </main>
          </div>
        );
      }
    }
    throw error;
  }

  const picks = squad.picks ?? [];
  const enrichedPlayers = await Promise.all(picks.map((pick) => fetchPlayerOrNull(pick.player_id!)));
  const squadClubs = new Set(
    enrichedPlayers.filter((p): p is Player => p != null && p.team != null).map((p) => p.team!)
  );

  const fixtures = fixturesResult.fixtures ?? [];
  const isRelevant = (fixture: Fixture) =>
    (fixture.home_team != null && squadClubs.has(fixture.home_team)) ||
    (fixture.away_team != null && squadClubs.has(fixture.away_team));

  return (
    <div className="flex flex-1 justify-center px-5 py-16">
      <main className="w-full max-w-3xl flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <Link
            href={`/teams/${teamId}`}
            aria-label={`Back to ${teamName}`}
            className="w-fit text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            ← {teamName}
          </Link>
          <h1 className="text-xl font-semibold">Fixtures</h1>
        </div>

        {fixturesResult.stale && fixturesResult.data_as_of ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Data as of{" "}
            <span className="font-numeral tabular-nums">{formatDataAsOfTime(fixturesResult.data_as_of)}</span>
          </p>
        ) : null}

        {fixtures.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No fixtures scheduled.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  Fixture list by gameweek with home and away difficulty ratings
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4 pl-3">
                      Gameweek
                    </th>
                    <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4">
                      Home
                    </th>
                    <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4">
                      Away
                    </th>
                    <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4">
                      Home difficulty
                    </th>
                    <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4">
                      Away difficulty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fixtures.map((fixture, i) => (
                    <FixtureRow key={i} fixture={fixture} highlighted={isRelevant(fixture)} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:hidden">
              {fixtures.map((fixture, i) => (
                <FixtureCard key={i} fixture={fixture} highlighted={isRelevant(fixture)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
