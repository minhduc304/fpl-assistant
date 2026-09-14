import Link from "next/link";
import type { components } from "@fpl-assistant/api-client";

type Player = components["schemas"]["Player"];

interface PlayerRowProps {
  player: Player;
  selected: boolean;
  onToggleCompare: (playerId: number) => void;
  compareDisabled: boolean;
}

export function PlayerRow({ player, selected, onToggleCompare, compareDisabled }: PlayerRowProps) {
  const disabled = compareDisabled && !selected;

  return (
    <li className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 gap-y-1 py-3 max-[480px]:grid-cols-[auto_1fr_auto] max-[480px]:gap-y-2">
      <label className="flex h-11 w-11 items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggleCompare(player.player_id!)}
          aria-label={`Compare ${player.name ?? "player"}`}
          aria-describedby={disabled ? "compare-limit-note" : undefined}
          className="h-5 w-5 accent-[var(--primary)]"
        />
      </label>

      <span className="flex flex-col max-[480px]:col-start-2">
        <span className="text-base font-medium">{player.name ?? "—"}</span>
        <span className="text-sm text-[var(--muted-foreground)]">{player.team ?? "—"}</span>
      </span>

      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs uppercase tracking-wide text-[var(--muted-foreground)] max-[480px]:col-start-3 max-[480px]:row-start-1">
        {player.position ?? "—"}
      </span>

      <span className="font-numeral tabular-nums text-sm text-right max-[480px]:col-start-1 max-[480px]:col-span-3 max-[480px]:row-start-2 max-[480px]:text-left">
        £{player.price != null ? player.price.toFixed(1) : "—"}
      </span>

      <span className="font-numeral tabular-nums text-sm text-right max-[480px]:col-start-1 max-[480px]:col-span-3 max-[480px]:row-start-2 max-[480px]:text-left">
        {player.total_points ?? "—"} pts
      </span>

      <span className="font-numeral tabular-nums text-sm text-right max-[480px]:col-start-1 max-[480px]:col-span-3 max-[480px]:row-start-2 max-[480px]:text-left">
        {player.form ?? "—"} form
      </span>

      <Link
        href={`/players/${player.player_id}`}
        className="justify-self-end text-sm text-[var(--muted-foreground)] underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] max-[480px]:col-start-1 max-[480px]:col-span-3 max-[480px]:row-start-3 max-[480px]:justify-self-start"
      >
        View stats
      </Link>
    </li>
  );
}
