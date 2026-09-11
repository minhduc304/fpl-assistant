import createClient from "openapi-fetch";
import type { paths, components } from "../generated/types.js";

export type { paths, components };
export type RecommendationContract = components["schemas"]["RecommendationContract"];
export type ReasoningFactor = components["schemas"]["ReasoningFactor"];
export type Alternative = components["schemas"]["Alternative"];

export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
