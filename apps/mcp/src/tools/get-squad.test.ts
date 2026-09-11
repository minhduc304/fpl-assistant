import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerGetSquad } from "./get-squad.js";

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

describe("get_squad", () => {
  it("returns the Rails JSON body as a text block on success", async () => {
    const body = {
      team_id: 1234567,
      formation: "3-4-3",
      picks: [
        { player_id: 302, name: "M. Salah", position: "MID", is_captain: true, is_vice_captain: false },
        { player_id: 401, name: "E. Haaland", position: "FWD", is_captain: false, is_vice_captain: true },
      ],
      data_as_of: "2026-09-06T09:00:00Z",
      stale: false,
    };
    globalThis.fetch = vi.fn(async () => jsonResponse(200, body));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetSquad(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "get_squad", arguments: { team_id: "1234567" } });

    expect(result).toEqual({ content: [{ type: "text", text: JSON.stringify(body) }] });
  });

  it.each([
    [404, "That team ID doesn't exist"],
    [503, "live data temporarily unavailable, try again shortly"],
  ])("maps a %i Rails response to isError: true", async (status, message) => {
    globalThis.fetch = vi.fn(async () => jsonResponse(status, { message }));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetSquad(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "get_squad", arguments: { team_id: "999999999" } });

    expect(result).toEqual({ content: [{ type: "text", text: message }], isError: true });
  });

  it("surfaces a missing team_id as a clean isError tool result, not an unhandled throw", async () => {
    globalThis.fetch = vi.fn();

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetSquad(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "get_squad", arguments: {} });

    expect(result.isError).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
