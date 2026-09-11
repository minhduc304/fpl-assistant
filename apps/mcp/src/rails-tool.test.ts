import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callRailsTool, RAILS_CALL_TIMEOUT_MS } from "./rails-tool.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_BASE_URL = process.env.FPL_API_BASE_URL;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  process.env.FPL_API_BASE_URL = "https://api.test";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env.FPL_API_BASE_URL = ORIGINAL_BASE_URL;
  vi.restoreAllMocks();
});

describe("callRailsTool", () => {
  it("returns the parsed body on a 2xx response", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(200, { id: "1234567" }));

    const result = await callRailsTool((client) => client.GET("/teams/{teamId}", { params: { path: { teamId: 1234567 } } }));

    expect(result).toEqual({ id: "1234567" });
  });

  it("applies RAILS_CALL_TIMEOUT_MS to the underlying request", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      expect((input as Request).signal).toBeInstanceOf(AbortSignal);
      return jsonResponse(200, { id: "1234567" });
    });

    await callRailsTool((client) => client.GET("/teams/{teamId}", { params: { path: { teamId: 1234567 } } }));

    expect(timeoutSpy).toHaveBeenCalledWith(RAILS_CALL_TIMEOUT_MS);
  });

  it.each([
    [400, "At least two playerIds are required for comparison"],
    [404, "That team ID doesn't exist"],
    [429, "Rate limit exceeded, please retry shortly"],
    [503, "Unable to produce a recommendation right now, please retry shortly"],
  ])("maps a %i Rails response to an isError tool result with the response message", async (status, message) => {
    globalThis.fetch = vi.fn(async () => jsonResponse(status, { message }));

    const result = await callRailsTool((client) => client.GET("/teams/{teamId}", { params: { path: { teamId: 1234567 } } }));

    expect(result).toEqual({ content: [{ type: "text", text: message }], isError: true });
  });

  it("falls back to a sane message when the error body has no message field", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(503, {}));

    const result = await callRailsTool((client) => client.GET("/teams/{teamId}", { params: { path: { teamId: 1234567 } } }));

    expect(result).toMatchObject({ isError: true });
    expect((result as { content: [{ text: string }] }).content[0].text.length).toBeGreaterThan(0);
  });

  it("lets a genuine network failure propagate instead of being caught into an isError result", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      callRailsTool((client) => client.GET("/teams/{teamId}", { params: { path: { teamId: 1234567 } } }))
    ).rejects.toThrow("fetch failed");
  });

  it("lets a timeout abort propagate instead of being caught into an isError result", async () => {
    // Simulates what the runtime fetch does when RAILS_CALL_TIMEOUT_MS elapses:
    // the request rejects with an AbortError rather than resolving a response.
    globalThis.fetch = vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });

    await expect(
      callRailsTool((client) => client.GET("/teams/{teamId}", { params: { path: { teamId: 1234567 } } }))
    ).rejects.toThrow("The operation timed out.");
  });
});
