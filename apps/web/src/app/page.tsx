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
    <div className="relative flex flex-1 flex-col min-[820px]:flex-row-reverse">
      <div className="relative w-full min-[820px]:w-1/2" style={{ background: "#0b0908", minHeight: "52vh" }}>
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "url(/hero.png)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div
          className="absolute top-4 right-4 max-w-[220px] text-right font-numeral text-xs leading-relaxed"
          style={{ color: "rgb(242 236 226 / 40%)" }}
        >
          Hero: Higgsfield draft render hf_20260918_034933. Still a draft asset — swap in a final hero
          pass before this ships as finished art.
        </div>
        <div
          className="absolute bottom-4 left-4 rounded-[3px] border border-dashed px-2 py-1 font-numeral text-xs uppercase tracking-wide"
          style={{ color: "rgb(242 236 226 / 55%)", borderColor: "rgb(242 236 226 / 35%)" }}
        >
          Hero — draft render
        </div>
      </div>

      <div
        className="pointer-events-none absolute top-0 bottom-0 z-[3] hidden w-11 min-[820px]:block"
        style={{
          left: "calc(50% - 22px)",
          backgroundImage: "radial-gradient(circle, var(--accent) 1.4px, transparent 1.6px)",
          backgroundSize: "8px 8px",
          maskImage: "linear-gradient(to right, transparent, black 45%, black 55%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 45%, black 55%, transparent)",
          opacity: 0.55,
        }}
      />

      <div className="flex w-full flex-col justify-center px-5 py-10 min-[820px]:w-1/2 min-[820px]:items-end min-[820px]:px-[5%] min-[820px]:py-8 min-[820px]:text-right">
        <div className="flex w-full max-w-[520px] flex-col min-[820px]:items-end">
          <h1
            className="mb-4 font-heading uppercase"
            style={{
              fontSize: "clamp(2.3rem, 7.2vw, 5.4rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
            }}
          >
            Stop guessing.
          </h1>
          <p
            className="mb-6 max-w-[38ch] font-numeral text-sm leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Pitchside turns live FPL data into one reasoned call: who to captain, who to sell,
            who&apos;s next. Not a stat dump.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-sm flex-col gap-2 min-[820px]:items-end"
          >
            <label htmlFor="team-id" className="self-start font-numeral text-sm min-[820px]:self-end">
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
              className="h-12 w-full rounded-lg border px-4 font-numeral text-2xl tabular-nums transition-colors duration-150 placeholder:text-[var(--faint)] placeholder:text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-[820px]:text-right"
              style={{
                backgroundColor: "var(--card)",
                borderColor: error ? "var(--destructive)" : "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <span
              id="team-id-hint"
              className="self-start font-numeral text-xs leading-relaxed min-[820px]:self-end"
              style={{ color: "var(--muted-foreground)" }}
            >
              Look in your team&apos;s page address on the FPL website or app — the number there is
              your ID.
            </span>

            {error ? (
              <div
                id="team-id-error"
                role="alert"
                aria-live="polite"
                className="flex w-full items-center gap-2 rounded-[3px] border px-2.5 py-2 font-numeral text-sm min-[820px]:justify-end"
                style={{
                  color: "var(--destructive)",
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
              className="mt-3 h-12 w-full rounded-[2px] font-numeral text-xs font-bold tracking-wide uppercase transition-[filter] duration-100 hover:brightness-[1.06] active:brightness-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--background)",
              }}
            >
              View team
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
