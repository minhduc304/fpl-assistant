"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setError("Enter your team ID to continue.");
      return;
    }
    if (!/^[0-9]+$/.test(trimmed)) {
      setError("Team ID must be numbers only, like 1234567.");
      return;
    }

    setError(null);
    router.push(`/teams/${trimmed}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-sm flex flex-col gap-7">
        <h1 className="text-center text-xl font-semibold">FPL Assistant</h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <label htmlFor="team-id" className="text-sm font-medium">
            Team ID
          </label>
          <input
            id="team-id"
            name="team-id"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1234567"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            aria-describedby={error ? "team-id-hint team-id-error" : "team-id-hint"}
            aria-invalid={error ? "true" : undefined}
            className="h-12 w-full rounded-lg border px-4 font-numeral text-2xl tabular-nums transition-colors duration-150 placeholder:text-[var(--faint)] placeholder:text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            style={{
              backgroundColor: "var(--card)",
              borderColor: error ? "var(--destructive)" : "var(--border-strong)",
              color: "var(--foreground)",
            }}
          />
          <span id="team-id-hint" className="text-sm text-[var(--muted-foreground)]">
            Look in your team&apos;s page address on the FPL website or app — the number there is
            your ID.
          </span>

          {error ? (
            <div
              id="team-id-error"
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
            className="mt-3 h-12 w-full rounded-lg text-base font-semibold transition-[filter] duration-100 hover:brightness-[1.06] active:brightness-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            View team
          </button>
        </form>
      </main>
    </div>
  );
}
