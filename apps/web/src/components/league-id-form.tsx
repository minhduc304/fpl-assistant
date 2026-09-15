"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LeagueIdForm({ teamId }: { teamId: number }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setError("Enter a league ID to continue.");
      return;
    }
    if (!/^[0-9]+$/.test(trimmed)) {
      setError("League ID must be numbers only, like 987654.");
      return;
    }

    setError(null);
    router.push(`/teams/${teamId}/mini-leagues/${trimmed}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-2 border-t pt-5"
      style={{ borderColor: "var(--border)" }}
    >
      <label htmlFor="league-id" className="text-sm font-medium">
        League ID
      </label>
      <input
        id="league-id"
        name="league-id"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="987654"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
        aria-describedby={error ? "league-id-hint league-id-error" : "league-id-hint"}
        aria-invalid={error ? "true" : undefined}
        className="h-11 w-full rounded-lg border px-4 font-numeral text-lg tabular-nums transition-colors duration-150 placeholder:text-[var(--faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        style={{
          backgroundColor: "var(--card)",
          borderColor: error ? "var(--destructive)" : "var(--border-strong)",
          color: "var(--foreground)",
        }}
      />
      <span id="league-id-hint" className="text-sm text-[var(--muted-foreground)]">
        Look in your mini-league&apos;s page address on the FPL website or app — the number there
        is the league ID.
      </span>

      {error ? (
        <div
          id="league-id-error"
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm"
          style={{
            color: "var(--destructive)",
            backgroundColor: "var(--destructive-dim)",
            borderColor: "var(--destructive)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="7" cy="9.6" r="0.9" fill="currentColor" />
          </svg>
          <span>{error}</span>
        </div>
      ) : null}

      <button
        type="submit"
        className="mt-1 h-12 w-full rounded-lg border text-base font-semibold transition-colors duration-150 hover:bg-[var(--card)] active:bg-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
        style={{
          borderColor: "var(--border-strong)",
          color: "var(--foreground)",
          backgroundColor: "transparent",
        }}
      >
        View standings
      </button>
    </form>
  );
}
