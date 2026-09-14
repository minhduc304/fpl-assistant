import type { ReasoningFactor } from "@fpl-assistant/api-client";

const FACTOR_LABELS: Record<string, string> = {
  recent_form: "Recent form",
  fixture_difficulty: "Fixture difficulty",
  expected_gain: "Expected gain",
  transfer_cost: "Transfer cost",
  affordability: "Affordability",
  ownership: "Ownership",
  candidate_pool: "Candidate pool",
};

function factorLabel(factor: string | undefined): string {
  if (!factor) return "—";
  return FACTOR_LABELS[factor] ?? factor;
}

export function ReasoningList({ reasoning }: { reasoning: ReasoningFactor[] | undefined }) {
  if (!reasoning || reasoning.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {reasoning.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }}>
            <path d="M3 7.5l2.5 2.5L11 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <span className="font-medium">{factorLabel(item.factor)}</span>
            {" — "}
            <span className="text-[var(--muted-foreground)]">
              {item.detail}
              {item.sample_size != null ? ` (based on ${item.sample_size} gameweeks)` : ""}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
