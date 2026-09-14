import type { components } from "@fpl-assistant/api-client";

type Player = components["schemas"]["Player"];

export function RecommendedPlayer({ name, player }: { name: string; player: Player | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-lg font-semibold">{name}</span>
      {player ? (
        <span className="text-sm text-[var(--muted-foreground)]">
          {player.team ?? "—"} · {player.position ?? "—"}
        </span>
      ) : null}
      {player && (player.price != null || player.total_points != null || player.form != null) ? (
        <span className="font-numeral tabular-nums text-sm text-[var(--muted-foreground)]">
          {player.price != null ? `£${player.price.toFixed(1)}` : "—"} ·{" "}
          {player.total_points != null ? `${player.total_points} pts` : "—"} ·{" "}
          {player.form != null ? `${player.form} form` : "—"}
        </span>
      ) : null}
    </div>
  );
}
