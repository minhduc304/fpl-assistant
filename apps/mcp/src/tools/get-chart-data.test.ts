import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerGetChartData } from "./get-chart-data.js";

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

describe("get_chart_data", () => {
  (["points_per_gameweek", "rank_trajectory", "price_history"] as const).forEach((type) => {
    it(`returns the Rails JSON body as a text block on success for type=${type}`, async () => {
      const body = {
        type,
        points: [
          { x: 1, y: 62 },
          { x: 2, y: 78 },
        ],
        stale: false,
      };
      let capturedUrl: string | undefined;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        capturedUrl = input instanceof Request ? input.url : String(input);
        return jsonResponse(200, body);
      });

      const server = new McpServer({ name: "test", version: "0.0.0" });
      registerGetChartData(server);
      const client = await connectedClient(server);

      const result = await client.callTool({
        name: "get_chart_data",
        arguments: { team_id: "1234567", type },
      });

      expect(result).toEqual({ content: [{ type: "text", text: JSON.stringify(body) }] });
      expect(capturedUrl).toContain(`type=${type}`);
    });
  });

  it.each([
    [404, "That team ID doesn't exist"],
    [503, "live data temporarily unavailable, try again shortly"],
  ])("maps a %i Rails response to isError: true", async (status, message) => {
    globalThis.fetch = vi.fn(async () => jsonResponse(status, { message }));

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetChartData(server);
    const client = await connectedClient(server);

    const result = await client.callTool({
      name: "get_chart_data",
      arguments: { team_id: "999999999", type: "points_per_gameweek" },
    });

    expect(result).toEqual({ content: [{ type: "text", text: message }], isError: true });
  });

  it("surfaces a missing type as a clean isError tool result, not an unhandled throw", async () => {
    globalThis.fetch = vi.fn();

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetChartData(server);
    const client = await connectedClient(server);

    const result = await client.callTool({ name: "get_chart_data", arguments: { team_id: "1234567" } });

    expect(result.isError).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("surfaces an invalid type as a clean isError tool result, not an unhandled throw", async () => {
    globalThis.fetch = vi.fn();

    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerGetChartData(server);
    const client = await connectedClient(server);

    const result = await client.callTool({
      name: "get_chart_data",
      arguments: { team_id: "1234567", type: "nonsense" },
    });

    expect(result.isError).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
