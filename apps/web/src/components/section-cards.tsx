import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"

function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <Card style={accent ? { background: "var(--accent)", color: "var(--accent-foreground)" } : undefined}>
      <CardHeader>
        <CardDescription
          className="text-xs"
          style={accent ? { color: "var(--accent-foreground)", opacity: 0.82 } : undefined}
        >
          {label}
        </CardDescription>
        <CardTitle
          className="text-lg font-semibold tabular-nums @[180px]/card:text-xl"
          style={accent ? { color: "var(--accent-foreground)" } : undefined}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

export function SectionCards({
  managerName,
  overallRank,
  totalPoints,
  squadCount,
  startingCount,
  avgPointsPerGameweek,
}: {
  managerName: string
  overallRank: number | null
  totalPoints: number | null
  squadCount: number | null
  startingCount: number | null
  avgPointsPerGameweek: number | null
}) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3 @5xl/main:grid-cols-6">
      <StatTile label="Manager" value={<span className="text-base">{managerName}</span>} />
      <StatTile label="Overall rank" value={overallRank != null ? overallRank.toLocaleString("en-GB") : "—"} />
      <StatTile label="Total points" value={totalPoints ?? "—"} accent />
      <StatTile label="Squad" value={squadCount ?? "—"} />
      <StatTile label="Starting XI" value={startingCount ?? "—"} />
      <StatTile label="Avg pts / GW" value={avgPointsPerGameweek ?? "—"} />
    </div>
  )
}
