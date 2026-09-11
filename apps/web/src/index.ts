import type { RecommendationContract } from "@fpl-assistant/api-client";

export function renderConfidence(contract: RecommendationContract): string {
  return contract.confidence;
}
