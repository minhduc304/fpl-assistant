import "server-only";
import { createApiClient } from "@fpl-assistant/api-client";

type ApiClient = ReturnType<typeof createApiClient>;

function resolveBaseUrl(): string {
  const raw = process.env.FPL_API_BASE_URL;
  if (!raw) {
    throw new Error("FPL_API_BASE_URL is not set");
  }
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
}

export function getApiClient(): ApiClient {
  return createApiClient(resolveBaseUrl());
}

export class RailsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RailsApiError";
    this.status = status;
  }
}

function extractMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "The FPL Assistant API returned an error.";
}

/**
 * Calls the Rails API through the typed client and unwraps the openapi-fetch
 * result, throwing RailsApiError on a non-2xx response so callers (server
 * actions / route handlers) can rely on try/catch instead of checking a
 * data/error union on every call.
 */
export async function callRailsApi<T>(
  fn: (client: ApiClient) => Promise<{ data?: T; error?: unknown; response: Response }>
): Promise<T> {
  const client = getApiClient();
  const { data, error, response } = await fn(client);
  if (!response.ok) {
    throw new RailsApiError(extractMessage(error), response.status);
  }
  return data as T;
}
