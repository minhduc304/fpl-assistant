import { notFound } from "next/navigation";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime, formatPosition } from "@/lib/format";

export default async function PlayerStatsPage({ params }: PageProps<"/players/[playerId]">) {
  const { playerId: playerIdParam } = await params;
  const playerId = Number(playerIdParam);
  if (!Number.isInteger(playerId)) {
    notFound();
  }

  let player;
  try {
    player = await callRailsApi((client) =>
      client.GET("/players/{playerId}", { params: { path: { playerId } } })
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
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{player.name ?? "—"}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {player.team ?? "—"} · {formatPosition(player.position)}
          </p>
        </div>

        <dl className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Price</dt>
            <dd className="font-numeral text-base tabular-nums">
              {player.price != null ? `£${player.price.toFixed(1)}` : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Total points</dt>
            <dd className="font-numeral text-base tabular-nums">{player.total_points ?? "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--muted-foreground)]">Form</dt>
            <dd className="font-numeral text-base tabular-nums">{player.form ?? "—"}</dd>
          </div>
        </dl>

        {player.stale && player.data_as_of ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Data as of <span className="font-numeral tabular-nums">{formatDataAsOfTime(player.data_as_of)}</span>
          </p>
        ) : null}
      </main>
    </div>
  );
}
