import { createApiClient } from "@fpl-assistant/api-client";

type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Single timeout applied to every Rails call made through `callRailsTool`.
 * No retry/backoff: Rails already retries against FPL and is itself
 * rate-limited, so a second retry layer here would just compound that budget.
 */
export const RAILS_CALL_TIMEOUT_MS = 10_000;

const FALLBACK_ERROR_MESSAGE = "The FPL Assistant API returned an error.";

const HTTP_METHODS = ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"] as const;

/** Wraps every HTTP method on an api-client instance so each call carries the shared timeout. */
function withTimeout(client: ApiClient): ApiClient {
  const wrapped = { ...client };
  for (const method of HTTP_METHODS) {
    const original = (client as any)[method];
    if (typeof original !== "function") continue;
    (wrapped as any)[method] = (url: unknown, options: Record<string, unknown> = {}) =>
      original.call(client, url, { ...options, signal: AbortSignal.timeout(RAILS_CALL_TIMEOUT_MS) });
  }
  return wrapped;
}

export interface RailsToolErrorResult {
  // Index signature matches the MCP SDK's CallToolResult shape so tool
  // handlers can return this value directly without a cast.
  [x: string]: unknown;
  content: [{ type: "text"; text: string }];
  isError: true;
}

function isErrorResult(value: unknown): value is RailsToolErrorResult {
  return typeof value === "object" && value !== null && (value as { isError?: unknown }).isError === true;
}

function extractMessage(errorBody: unknown): string {
  if (
    typeof errorBody === "object" &&
    errorBody !== null &&
    "message" in errorBody &&
    typeof (errorBody as { message: unknown }).message === "string"
  ) {
    return (errorBody as { message: string }).message;
  }
  return FALLBACK_ERROR_MESSAGE;
}

/**
 * Every Task 43-48 tool handler calls the Rails API through this helper instead
 * of a bespoke per-tool try/catch. It:
 *  - applies RAILS_CALL_TIMEOUT_MS to the call (no retry/backoff)
 *  - maps a non-2xx Rails response to an `isError: true` tool result
 *  - lets a genuine network failure or timeout throw, so the MCP SDK turns it
 *    into a protocol-level error rather than a raw 500-shaped leak
 *
 * Usage: `await callRailsTool(client => client.GET("/players/{playerId}", { params }))`
 */
export async function callRailsTool<T>(
  fn: (client: ApiClient) => Promise<{ data?: T; error?: unknown; response: Response }>
): Promise<T | RailsToolErrorResult> {
  const baseUrl = process.env.FPL_API_BASE_URL ?? "";
  const client = withTimeout(createApiClient(baseUrl));
  const { data, error, response } = await fn(client);

  if (!response.ok) {
    return { content: [{ type: "text", text: extractMessage(error) }], isError: true };
  }

  return data as T;
}

export { isErrorResult };
