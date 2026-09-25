"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export function ChartAreaInteractive({
  title,
  points,
  latestLabel,
  accent = false,
}: {
  title: string
  points: number[]
  latestLabel: string
  accent?: boolean
}) {
  if (points.length < 2) return null

  const width = 400
  const height = 130
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const linePath = points
    .map((y, i) => `${i === 0 ? "M" : "L"}${i * step},${height - ((y - min) / range) * height}`)
    .join(" ")

  return (
    <Card className="gap-0">
      <CardHeader className="border-b-2 pb-3 flex-row items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <CardTitle className="text-sm uppercase tracking-wide">{title}</CardTitle>
        <span className="font-numeral text-sm font-bold tabular-nums">{latestLabel}</span>
      </CardHeader>
      <div className="px-4 py-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full" preserveAspectRatio="none">
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="var(--border)" strokeOpacity="0.2" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="var(--border)" strokeOpacity="0.2" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="var(--border)" strokeOpacity="0.2" />
          <path
            d={linePath}
            fill="none"
            stroke={accent ? "var(--accent)" : "var(--foreground)"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Card>
  )
}
