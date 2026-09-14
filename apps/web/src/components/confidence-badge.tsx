import type { RecommendationContract } from "@fpl-assistant/api-client";

type Confidence = NonNullable<RecommendationContract["confidence"]>;

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  high: "var(--primary)",
  medium: "var(--muted-foreground)",
  low: "var(--faint)",
};

function ConfidenceIcon({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="currentColor" />
      </svg>
    );
  }
  if (confidence === "medium") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence | undefined }) {
  if (!confidence) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm font-medium"
      style={{ color: CONFIDENCE_COLORS[confidence] }}
    >
      <ConfidenceIcon confidence={confidence} />
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}
