import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Fixture } from "@/lib/team-dashboard"

export function FixturesTable({
  teamId,
  gameweek,
  fixtures,
}: {
  teamId: number
  gameweek: number | null
  fixtures: Fixture[]
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="border-b-2 pb-3 flex-row items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <CardTitle className="text-sm uppercase tracking-wide">Fixtures</CardTitle>
        {gameweek != null ? (
          <span className="font-numeral text-sm font-bold tabular-nums">GW {gameweek}</span>
        ) : null}
      </CardHeader>
      {fixtures.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Home</TableHead>
              <TableHead />
              <TableHead>Away</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixtures.map((fixture, i) => (
              <TableRow key={i}>
                <TableCell>{fixture.home_team ?? "—"}</TableCell>
                <TableCell className="text-center" style={{ color: "var(--muted-foreground)" }}>
                  vs
                </TableCell>
                <TableCell>
                  {fixture.is_blank_gameweek ? (
                    <span
                      className="border-2 px-2 py-0.5 text-[0.7rem] font-bold uppercase"
                      style={{ borderColor: "var(--foreground)" }}
                    >
                      Blank GW
                    </span>
                  ) : (
                    (fixture.away_team ?? "—")
                  )}
                  {fixture.is_double_gameweek ? (
                    <span
                      className="ml-2 border-2 px-2 py-0.5 text-[0.7rem] font-bold uppercase"
                      style={{ borderColor: "var(--foreground)", background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      Double GW
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="px-4 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Not available right now.
        </p>
      )}
      <Link
        href={`/teams/${teamId}/fixtures`}
        className="mx-4 my-4 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide no-underline"
        style={{
          border: "3px solid var(--foreground)",
          boxShadow: "3px 3px 0 var(--foreground)",
          background: "var(--foreground)",
          color: "#ffffff",
        }}
      >
        View all fixtures →
      </Link>
    </Card>
  )
}
