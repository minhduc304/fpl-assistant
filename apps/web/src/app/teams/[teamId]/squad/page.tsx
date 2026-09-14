import Link from "next/link";
import { notFound } from "next/navigation";
import type { components } from "@fpl-assistant/api-client";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime } from "@/lib/format";

type SquadPick = components["schemas"]["SquadPick"];

const PITCH_POSITION_ORDER = ["FWD", "MID", "DEF", "GKP"] as const;
const POSITION_LABEL: Record<(typeof PITCH_POSITION_ORDER)[number], string> = {
  FWD: "Forwards",
  MID: "Midfielders",
  DEF: "Defenders",
  GKP: "Goalkeeper",
};

function groupByPosition(picks: SquadPick[]) {
  return PITCH_POSITION_ORDER.map((position) => ({
    position,
    label: POSITION_LABEL[position],
    picks: picks.filter((pick) => pick.position === position),
  })).filter((group) => group.picks.length > 0);
}

function PlayerChip({ pick }: { pick: SquadPick }) {
  return (
    <li
      className="flex min-w-[90px] flex-col items-center gap-1 rounded-lg border px-3 py-2 text-center"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <span className="text-sm">{pick.name}</span>
      {pick.is_captain || pick.is_vice_captain ? (
        <span
          className="rounded-md border px-1.5 text-xs font-semibold"
          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          aria-label={pick.is_captain ? "Captain" : "Vice-captain"}
        >
          {pick.is_captain ? "C" : "VC"}
        </span>
      ) : null}
    </li>
  );
}

export default async function SquadPage({ params }: PageProps<"/teams/[teamId]/squad">) {
  const { teamId: teamIdParam } = await params;
  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId)) {
    notFound();
  }

  let squad;
  let teamName;
  try {
    [teamName, squad] = await Promise.all([
      callRailsApi((client) =>
        client.GET("/teams/{teamId}", { params: { path: { teamId } } })
      ).then((team) => team.name),
      callRailsApi((client) =>
        client.GET("/teams/{teamId}/squad", { params: { path: { teamId } } })
      ),
    ]);
  } catch (error) {
    if (error instanceof RailsApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const picks = squad.picks ?? [];
  const starting = groupByPosition(picks.filter((pick) => pick.is_starting));
  const bench = picks.filter((pick) => !pick.is_starting);

  return (
    <div className="flex flex-1 justify-center px-5 py-16">
      <main className="w-full max-w-md lg:max-w-xl flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <Link
            href={`/teams/${teamId}`}
            aria-label={`Back to ${teamName}`}
            className="w-fit text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            ← {teamName}
          </Link>
          <h1 className="text-xl font-semibold">{teamName}</h1>
        </div>

        {squad.stale && squad.data_as_of ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Data as of{" "}
            <span className="font-numeral tabular-nums">{formatDataAsOfTime(squad.data_as_of)}</span>
          </p>
        ) : null}

        <section aria-labelledby="starting-xi-heading" className="flex flex-col gap-5">
          <h2 id="starting-xi-heading" className="text-base font-semibold">
            Starting XI
          </h2>
          {starting.map((group) => (
            <div key={group.position} className="flex flex-col gap-2">
              <h3 className="text-sm text-[var(--muted-foreground)]">{group.label}</h3>
              <ul className="flex flex-wrap justify-center gap-2">
                {group.picks.map((pick) => (
                  <PlayerChip key={pick.player_id} pick={pick} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section
          aria-labelledby="bench-heading"
          className="flex flex-col gap-2 border-t pt-5"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 id="bench-heading" className="text-base font-semibold">
            Bench
          </h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {bench.map((pick) => (
              <PlayerChip key={pick.player_id} pick={pick} />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
