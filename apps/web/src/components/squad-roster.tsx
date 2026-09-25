import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import type { SquadPick } from "@/lib/team-dashboard"

function PickRow({ pick }: { pick: SquadPick }) {
  return (
    <div className="roster-row">
      <span className="pos-badge">{pick.position ?? "—"}</span>
      <span className="roster-name">
        {pick.name ?? "—"}
        {pick.is_captain ? <span className="cap-mark">C</span> : null}
        {pick.is_vice_captain ? <span className="vc-mark">V</span> : null}
      </span>
    </div>
  )
}

export function SquadRoster({
  teamId,
  formation,
  picks,
}: {
  teamId: number
  formation: string
  picks: SquadPick[]
}) {
  const starting = picks.filter((p) => p.is_starting)
  const bench = picks.filter((p) => !p.is_starting)

  return (
    <Card className="gap-0">
      <CardHeader className="border-b-2 pb-3 flex-row items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <CardTitle className="text-sm uppercase tracking-wide">Squad — {formation}</CardTitle>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {picks.length} players
        </span>
      </CardHeader>
      <div className="roster">
        {starting.length > 0 ? (
          <>
            <p className="roster-group-label">Starting XI</p>
            {starting.map((pick) => (
              <PickRow key={pick.player_id} pick={pick} />
            ))}
          </>
        ) : null}
        {bench.length > 0 ? (
          <>
            <p className="roster-group-label">Bench</p>
            {bench.map((pick) => (
              <PickRow key={pick.player_id} pick={pick} />
            ))}
          </>
        ) : null}
      </div>
      <Link
        href={`/teams/${teamId}/squad`}
        className="mx-4 my-4 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide no-underline"
        style={{
          border: "3px solid var(--foreground)",
          boxShadow: "3px 3px 0 var(--foreground)",
          background: "var(--foreground)",
          color: "#ffffff",
        }}
      >
        View squad →
      </Link>
    </Card>
  )
}
