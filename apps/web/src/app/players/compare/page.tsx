import Link from "next/link";
import { callRailsApi, RailsApiError } from "@/lib/api";
import { formatDataAsOfTime, formatPosition } from "@/lib/format";

export default async function ComparePlayersPage({
  searchParams,
}: PageProps<"/players/compare">) {
  const { playerIds } = await searchParams;
  const playerIdsParam = Array.isArray(playerIds) ? playerIds[0] : playerIds;

  let result;
  try {
    result = await callRailsApi((client) =>
      client.GET("/players/compare", { params: { query: { playerIds: playerIdsParam ?? "" } } })
    );
  } catch (error) {
    if (error instanceof RailsApiError && error.status === 400) {
      return (
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <main className="w-full max-w-sm flex flex-col gap-4">
            <div
              role="alert"
              aria-live="polite"
              className="rounded-md border px-2.5 py-2 text-sm"
              style={{
                color: "var(--destructive)",
                backgroundColor: "var(--destructive-dim)",
                borderColor: "var(--destructive)",
              }}
            >
              Select at least 2 players to compare.
            </div>
            <Link
              href="/players"
              className="text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Back to players
            </Link>
          </main>
        </div>
      );
    }
    throw error;
  }

  const players = result.players ?? [];
  const isStale = result.stale && result.data_as_of;

  const rows: { label: string; render: (p: (typeof players)[number]) => string }[] = [
    { label: "Team", render: (p) => p.team ?? "—" },
    { label: "Position", render: (p) => formatPosition(p.position) },
    { label: "Price", render: (p) => (p.price != null ? `£${p.price.toFixed(1)}` : "—") },
    { label: "Total points", render: (p) => (p.total_points != null ? String(p.total_points) : "—") },
    { label: "Form", render: (p) => (p.form != null ? String(p.form) : "—") },
  ];

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-3xl flex flex-col gap-7">
        <h1 className="text-xl font-semibold">Compare players</h1>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Side-by-side stat comparison for the selected players</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium text-[var(--muted-foreground)] py-2 pr-4" />
                {players.map((p) => (
                  <th key={p.player_id} scope="col" className="text-left font-medium py-2 pr-4">
                    {p.name ?? "—"}
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
                  {players.map((p) => (
                    <td key={p.player_id} className="font-numeral tabular-nums py-2 pr-4">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-6 sm:hidden">
          {players.map((p) => (
            <div key={p.player_id} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">{p.name ?? "—"}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {p.team ?? "—"} · {formatPosition(p.position)}
                </p>
              </div>
              <dl className="flex flex-col gap-2">
                {rows.slice(2).map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-[var(--muted-foreground)]">{row.label}</dt>
                    <dd className="font-numeral text-sm tabular-nums">{row.render(p)}</dd>
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
