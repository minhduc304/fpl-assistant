"use client";

import { Area } from "./area";
import { AreaChart } from "./area-chart";
import { Grid } from "./grid";

interface Point {
  x: number;
  y: number;
}

function GameweekAxis({ points }: { points: Point[] }) {
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const tickCount = Math.min(5, points.length);
  const seen = new Set<number>();
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    const idx = Math.round((i * (points.length - 1)) / Math.max(tickCount - 1, 1));
    const value = points[idx].x;
    if (!seen.has(value)) {
      seen.add(value);
      ticks.push(value);
    }
  }
  return (
    <div className="relative mt-1 h-4 text-xs text-[var(--muted-foreground)]" aria-hidden="true">
      {ticks.map((v) => (
        <span
          key={v}
          className="absolute -translate-x-1/2 font-numeral tabular-nums"
          style={{ left: max === min ? "50%" : `${((v - min) / (max - min)) * 100}%` }}
        >
          GW {v}
        </span>
      ))}
    </div>
  );
}

export function TeamAreaChart({ points }: { points: Point[] }) {
  return (
    <div className="flex flex-col gap-1">
      <AreaChart data={points as unknown as Record<string, unknown>[]} xDataKey="x" aspectRatio="3 / 1">
        <Grid />
        <Area dataKey="y" />
      </AreaChart>
      <GameweekAxis points={points} />
    </div>
  );
}
