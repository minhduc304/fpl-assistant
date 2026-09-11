import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSuggestTransfer } from "./suggest-transfer.js";

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
  recommendation: {
    player_out: { player_id: 210, name: "J. Struggling" },
    player_in: { player_id: 415, name: "B. Differential" },
  },
  confidence: "medium",
  reasoning: [
    {
      factor: "underlying_stats",
      detail: "player_in leads the league in xG per 90 among sub-10%-owned midfielders",
      sample_size: 8,
    },
    {
      factor: "fixture_run",
      detail: "player_in's team has 3 fixtures rated 2 or easier in the next 5 gameweeks",
      sample_size: 5,
    },
  ],
  alternatives: [
    {
      option: {
        player_out: { player_id: 210, name: "J. Struggling" },
        player_in: { player_id: 322, name: "C. Template" },
      },
      reasoning: [{ factor: "ownership", detail: "Owned by 45% of top 10k managers", sample_size: 10 }],
      why_not_top_pick: "Safer but offers no differential rank upside",
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

describe("suggest_transfer", () => {
  it("returns the full RecommendationContract body as a text block on success, unchanged", async () => {
    globalThis.fetch = vi.fn(async () => jsonResponse(200, RECOMMENDATION_BODY));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestTransfer(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "suggest_transfer", arguments: { team_id: "1234567" } });

    expect(result).toEqual({ content: [{ type: "text", text: JSON.stringify(RECOMMENDATION_BODY) }] });
  });

  it("does not send risk_tolerance when omitted (Rails owns the default)", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => jsonResponse(200, RECOMMENDATION_BODY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestTransfer(server);
    const client = await connectedClient(server);

    await client.callTool({ name: "suggest_transfer", arguments: { team_id: "1234567" } });

    const [omittedInput] = fetchMock.mock.calls[0];
    const requestedUrlOmitted = new URL(
      omittedInput instanceof Request ? omittedInput.url : omittedInput.toString()
    );
    expect(requestedUrlOmitted.searchParams.has("risk_tolerance")).toBe(false);
  });

  it("passes risk_tolerance through as a query param when provided", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => jsonResponse(200, RECOMMENDATION_BODY));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestTransfer(server);
    const client = await connectedClient(server);

    await client.callTool({
      name: "suggest_transfer",
      arguments: { team_id: "1234567", risk_tolerance: "differential" },
    });

    const [providedInput] = fetchMock.mock.calls[0];
    const requestedUrlProvided = new URL(
      providedInput instanceof Request ? providedInput.url : providedInput.toString()
    );
    expect(requestedUrlProvided.searchParams.get("risk_tolerance")).toBe("differential");
  });

  it.each([
    [404, "That team ID doesn't exist"],
    [503, "live data temporarily unavailable, try again shortly"],
  ])("maps a %i Rails response to isError: true", async (status, message) => {
    globalThis.fetch = vi.fn(async () => jsonResponse(status, { message }));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestTransfer(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "suggest_transfer", arguments: { team_id: "999999999" } });

    expect(result).toEqual({ content: [{ type: "text", text: message }], isError: true });
  });

  it("surfaces a missing team_id as a clean isError tool result, not an unhandled throw", async () => {
    globalThis.fetch = vi.fn();

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerSuggestTransfer(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "suggest_transfer", arguments: {} });

    expect(result.isError).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
