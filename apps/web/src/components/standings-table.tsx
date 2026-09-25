import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MiniLeagueEntry } from "@/lib/team-dashboard"

export function StandingsTable({
  teamId,
  leagueId,
  leagueName,
  standings,
}: {
  teamId: number
  leagueId: number
  leagueName: string
  standings: MiniLeagueEntry[]
}) {
  const myIndex = standings.findIndex((entry) => entry.team_id === teamId)
  const myRank = myIndex >= 0 ? standings[myIndex] : null
  const top = standings.slice(0, 5)
  const rows = myRank && !top.includes(myRank) ? [...top, myRank] : top

  return (
    <Card className="gap-0">
      <CardHeader className="border-b-2 pb-3 flex-row items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <CardTitle className="text-sm uppercase tracking-wide">{leagueName}</CardTitle>
        {myRank?.rank != null ? (
          <span className="font-numeral text-sm font-bold tabular-nums">#{myRank.rank}</span>
        ) : null}
      </CardHeader>
      {rows.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((entry) => (
              <TableRow
                key={entry.team_id}
                style={
                  entry.team_id === teamId
                    ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                    : undefined
                }
              >
                <TableCell className="tabular-nums font-bold">{entry.rank ?? "—"}</TableCell>
                <TableCell>{entry.team_name ?? "—"}</TableCell>
                <TableCell className="tabular-nums font-bold">{entry.total_points ?? "—"}</TableCell>
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
        href={`/teams/${teamId}/mini-leagues/${leagueId}`}
        className="mx-4 my-4 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide no-underline"
        style={{
          border: "3px solid var(--foreground)",
          boxShadow: "3px 3px 0 var(--foreground)",
          background: "var(--foreground)",
          color: "#ffffff",
        }}
      >
        View standings →
      </Link>
    </Card>
  )
}
