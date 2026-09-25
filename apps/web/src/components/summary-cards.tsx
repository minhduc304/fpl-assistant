import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfidenceBadge } from "@/components/confidence-badge"
import { ReasoningList } from "@/components/reasoning-list"
import type { ReasoningFactor } from "@fpl-assistant/api-client"

function SummaryCard({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="border-b-2 pb-3" style={{ borderColor: "var(--border)" }}>
        <CardTitle className="text-sm uppercase tracking-wide">{title}</CardTitle>
      </CardHeader>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4 text-sm">{children}</div>
      <Link
        href={href}
        className="mx-4 mb-4 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide no-underline"
        style={{
          border: "3px solid var(--foreground)",
          boxShadow: "3px 3px 0 var(--foreground)",
          background: "var(--foreground)",
          color: "#ffffff",
        }}
      >
        View details →
      </Link>
    </Card>
  )
}

function Unavailable() {
  return <p style={{ color: "var(--muted-foreground)" }}>Not available right now.</p>
}

export function SummaryCards({
  teamId,
  captainPreview,
  transferPreview,
}: {
  teamId: number
  captainPreview: { name: string; confidence?: string; reasoning: ReasoningFactor[] } | null
  transferPreview: { out: string; in: string; confidence?: string; reasoning: ReasoningFactor[] } | null
}) {
  return (
    <div className="flex flex-col gap-4">
      <SummaryCard title="Captain suggestion" href={`/teams/${teamId}/captain`}>
        {captainPreview ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold">{captainPreview.name}</span>
              <ConfidenceBadge confidence={captainPreview.confidence as "high" | "medium" | "low" | undefined} />
            </div>
            <ReasoningList reasoning={captainPreview.reasoning} />
          </>
        ) : (
          <Unavailable />
        )}
      </SummaryCard>

      <SummaryCard title="Transfer suggestion" href={`/teams/${teamId}/transfer`}>
        {transferPreview ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">
                {transferPreview.out} <span style={{ color: "var(--muted-foreground)" }}>→</span> {transferPreview.in}
              </span>
              <ConfidenceBadge confidence={transferPreview.confidence as "high" | "medium" | "low" | undefined} />
            </div>
            <ReasoningList reasoning={transferPreview.reasoning} />
          </>
        ) : (
          <Unavailable />
        )}
      </SummaryCard>
    </div>
  )
}
