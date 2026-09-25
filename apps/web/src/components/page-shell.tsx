"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const WORDMARK = "PITCHSIDE";

function tagForPathname(pathname: string): string {
  const teamMatch = pathname.match(/^\/teams\/(\d+)/);
  if (teamMatch) return `TEAM ${teamMatch[1]}`;
  return "FPL DATA";
}

export function PageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tag = tagForPathname(pathname);

  // The /dashboard sandbox (neo-brutalist exploration, scoped per its own
  // design system) renders its own full chrome — sidebar, wordmark, team tag.
  // The Matchday Grain shell's chrome would sandwich it in a clashing wordmark
  // and near-black bars, so it's suppressed for this route only.
  if (pathname.startsWith("/dashboard")) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <span
          className="font-heading text-base tracking-[0.03em] text-[var(--foreground)]"
          style={{ fontWeight: 400 }}
        >
          {WORDMARK}
        </span>
        <span
          className="w-max rounded-[3px] border px-[7px] py-[3px] font-numeral text-xs uppercase tracking-[0.03em] text-[var(--muted-foreground)]"
          style={{ borderColor: "var(--border)" }}
        >
          {tag}
        </span>
      </div>

      <div className="flex flex-1 flex-col">{children}</div>

      <div className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <span className="font-numeral text-xs text-[var(--muted-foreground)]">
          51.5074&deg; N / 0.1278&deg; W
        </span>
        <span className="font-numeral text-xs text-[var(--muted-foreground)]">
          REF xGI-004417
        </span>
      </div>
    </>
  );
}
