import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerGetFixtures } from "./get-fixtures.js";

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

beforeEach(() => {
  process.env.FPL_API_BASE_URL = "https://api.test";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env.FPL_API_BASE_URL = ORIGINAL_BASE_URL;
  vi.restoreAllMocks();
});

describe("get_fixtures", () => {
  it("returns the Rails JSON body as a text block on success with both params omitted, DGW/BGW flags surviving unchanged", async () => {
    const body = {
      fixtures: [
        {
          gameweek: 7,
          home_team: "Liverpool",
          away_team: "Everton",
          difficulty_home: 2,
          difficulty_away: 4,
          is_double_gameweek: false,
          is_blank_gameweek: false,
        },
        {
          gameweek: 18,
          home_team: "Man City",
          away_team: null,
          difficulty_home: null,
          difficulty_away: null,
          is_double_gameweek: true,
          is_blank_gameweek: true,
        },
      ],
      stale: false,
    };
    let capturedUrl: string | undefined;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = input instanceof Request ? input.url : String(input);
      return jsonResponse(200, body);
    });

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetFixtures(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "get_fixtures", arguments: {} });

    expect(result).toEqual({ content: [{ type: "text", text: JSON.stringify(body) }] });
    expect(capturedUrl).not.toContain("gameweek=");
    expect(capturedUrl).not.toContain("teamId=");
  });

  it("returns the Rails JSON body as a text block on success with both params provided, building the query string correctly", async () => {
    const body = { fixtures: [], stale: false };
    let capturedUrl: string | undefined;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = input instanceof Request ? input.url : String(input);
      return jsonResponse(200, body);
    });

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetFixtures(server);
    const client = await connectedClient(server);

    const result = await client.callTool({
      name: "get_fixtures",
      arguments: { gameweek: 7, team_id: "42" },
    });

    expect(result).toEqual({ content: [{ type: "text", text: JSON.stringify(body) }] });
    expect(capturedUrl).toContain("gameweek=7");
    expect(capturedUrl).toContain("teamId=42");
  });

  it("maps a 503 Rails response to isError: true", async () => {
    const message = "live data temporarily unavailable, try again shortly";
    globalThis.fetch = vi.fn(async () => jsonResponse(503, { message }));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetFixtures(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "get_fixtures", arguments: {} });

    expect(result).toEqual({ content: [{ type: "text", text: message }], isError: true });
  });
});
