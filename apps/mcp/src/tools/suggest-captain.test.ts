import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSuggestCaptain } from "./suggest-captain.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_BASE_URL = process.env.FPL_API_BASE_URL;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function connectedClient(server: McpServer): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

const RECOMMENDATION_BODY = {
  recommendation: { player_id: 302, name: "M. Salah" },
  confidence: "high",
  reasoning: [
    { factor: "fixture_difficulty", detail: "Faces the league's 18th-ranked defense at home", sample_size: 12 },
    { factor: "recent_form", detail: "Scored or assisted in 5 of the last 6 gameweeks", sample_size: 6 },
  ],
  alternatives: [
    {
      option: { player_id: 401, name: "E. Haaland" },
      reasoning: [{ factor: "recent_form", detail: "4 goals in the last 3 gameweeks", sample_size: 3 }],
      why_not_top_pick: "Tougher away fixture against a top-6 defense",
    },
  ],
};

beforeEach(() => {
  process.env.FPL_API_BASE_URL = "https://api.test";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env.FPL_API_BASE_URL = ORIGINAL_BASE_URL;
  vi.restoreAllMocks();
});

describe("suggest_captain", () => {
  it("returns the full RecommendationContract body as a text block on success, unchanged", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(200, RECOMMENDATION_BODY));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestCaptain(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "suggest_captain", arguments: { team_id: "1234567" } });

    expect(result).toEqual({ content: [{ type: "text", text: JSON.stringify(RECOMMENDATION_BODY) }] });
  });

  it("passes gameweek through as a query param when provided", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => jsonResponse(200, RECOMMENDATION_BODY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestCaptain(server);
    const client = await connectedClient(server);

    await client.callTool({ name: "suggest_captain", arguments: { team_id: "1234567", gameweek: 7 } });

    const [input] = fetchMock.mock.calls[0];
    const requestedUrl = new URL(input instanceof Request ? input.url : input.toString());
    expect(requestedUrl.searchParams.get("gameweek")).toBe("7");
  });

  it.each([
    [404, "That team ID doesn't exist"],
    [503, "live data temporarily unavailable, try again shortly"],
  ])("maps a %i Rails response to isError: true", async (status, message) => {
    globalThis.fetch = vi.fn(async () => jsonResponse(status, { message }));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestCaptain(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "suggest_captain", arguments: { team_id: "999999999" } });

    expect(result).toEqual({ content: [{ type: "text", text: message }], isError: true });
  });

  it("surfaces a missing team_id as a clean isError tool result, not an unhandled throw", async () => {
    globalThis.fetch = vi.fn();

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestCaptain(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "suggest_captain", arguments: {} });

    expect(result.isError).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
