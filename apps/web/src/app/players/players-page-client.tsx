"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { components } from "@fpl-assistant/api-client";
import { PlayerRow } from "@/components/player-row";
import { PlayerRowSkeleton } from "@/components/player-row-skeleton";
import { formatPosition } from "@/lib/format";

type Player = components["schemas"]["Player"];

const POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All positions" },
  { value: "GKP", label: formatPosition("GKP") },
  { value: "DEF", label: formatPosition("DEF") },
  { value: "MID", label: formatPosition("MID") },
  { value: "FWD", label: formatPosition("FWD") },
];

const DEBOUNCE_MS = 300;
const COMPARE_CAP = 4;

export function PlayersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("query") ?? "");
  const [position, setPosition] = useState(searchParams.get("position") ?? "");
  const [team, setTeam] = useState(searchParams.get("team") ?? "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPlayers = useCallback(async (nextName: string, nextPosition: string, nextTeam: string) => {
    setLoading(true);
    setLiveMessage("Loading players.");

    const params = new URLSearchParams();
    if (nextName) params.set("query", nextName);
    if (nextPosition) params.set("position", nextPosition);
    if (nextTeam) params.set("team", nextTeam);

    router.replace(params.size > 0 ? `/players?${params.toString()}` : "/players");

    const response = await fetch(`/api/players?${params.toString()}`);
    const data = await response.json();
    const results: Player[] = data.players ?? [];
    setPlayers(results);
    setLoading(false);
    setLiveMessage(
      results.length === 0
        ? "No players match."
        : `${results.length} ${results.length === 1 ? "player" : "players"} found.`
    );
  }, [router]);

  useEffect(() => {
    fetchPlayers(name, position, team);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPlayers(value, position, team), DEBOUNCE_MS);
  }

  function handleTeamChange(value: string) {
    setTeam(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPlayers(name, position, value), DEBOUNCE_MS);
  }

  function handlePositionChange(value: string) {
    setPosition(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchPlayers(name, value, team);
  }

  function toggleCompare(playerId: number) {
    setSelectedIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= COMPARE_CAP) {
        return current;
      }
      return [...current, playerId];
    });
  }

  const teamOptions = Array.from(new Set(players.map((p) => p.team).filter((t): t is string => !!t)));
  const compareDisabled = selectedIds.length >= COMPARE_CAP;
  const canCompare = selectedIds.length >= 2;

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-12">
      <main className="w-full max-w-2xl flex flex-col gap-6 pb-24">
        <h1 className="text-xl font-semibold">Players</h1>

        <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="player-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="player-name"
              type="text"
              placeholder="Search by name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-11 rounded-lg border px-3 text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border-strong)", color: "var(--foreground)" }}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="player-position" className="text-sm font-medium">
              Position
            </label>
            <select
              id="player-position"
              value={position}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="h-11 rounded-lg border px-3 text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border-strong)", color: "var(--foreground)" }}
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="player-team" className="text-sm font-medium">
              Team
            </label>
            <input
              id="player-team"
              type="text"
              list="team-options"
              placeholder="Any team"
              value={team}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="h-11 rounded-lg border px-3 text-base transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border-strong)", color: "var(--foreground)" }}
            />
            <datalist id="team-options">
              {teamOptions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </form>

        <span id="compare-limit-note" className="sr-only">
          Limit of 4 reached. Remove a player to add this one.
        </span>
        <div role="status" aria-live="polite" className="sr-only">
          {liveMessage}
        </div>

        {loading ? (
          <ul aria-hidden="true" className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <PlayerRowSkeleton key={i} />
            ))}
          </ul>
        ) : players.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No players match. Try a different name, position, or team.
          </p>
        ) : (
          <ul className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {players.map((player) => (
              <PlayerRow
                key={player.player_id}
                player={player}
                selected={player.player_id != null && selectedIds.includes(player.player_id)}
                onToggleCompare={toggleCompare}
                compareDisabled={compareDisabled}
              />
            ))}
          </ul>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center border-t px-5 py-3" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        <button
          type="button"
          disabled={!canCompare}
          onClick={() => router.push(`/players/compare?playerIds=${selectedIds.join(",")}`)}
          className="h-11 w-full max-w-2xl rounded-lg text-base font-semibold transition-[filter] duration-100 hover:brightness-[1.06] active:brightness-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] disabled:opacity-50 disabled:pointer-events-none"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Compare selected ({selectedIds.length}/{COMPARE_CAP})
        </button>
      </div>
    </div>
  );
}
