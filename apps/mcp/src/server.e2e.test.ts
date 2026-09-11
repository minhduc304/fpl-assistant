import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer as createHttpServer, type Server } from "node:http";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handleMcpRequest } from "./server.js";

/**
 * End-to-end proof, separate from every Task 43-48 tool's own mocked-API-client
 * unit tests: boots the REAL MCP HTTP transport and drives it with a REAL
 * @modelcontextprotocol/sdk Streamable HTTP client, over real localhost HTTP,
 * against a REAL Rails-contract server.
 *
 * "Rails server" here is a Prism mock (`npm run mock`'s underlying command)
 * serving openapi.yaml's own examples over real HTTP — not the actual Rails
 * app. This is deliberate: Prism never calls the live FPL API (same "no real
 * network to FPL" discipline every RSpec spec in api/ already follows), needs
 * no Postgres/test-mode Rails process for a Node test to spawn and coordinate
 * with, and has already been used as the manual verification target for every
 * one of Tasks 43-48's tools — its responses are the openapi.yaml examples
 * that ARE the contract Rails is built against. Booting real `bin/rails
 * server` here would add a fragile cross-language process dependency to solve
 * a problem Prism already solves by construction.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");

const EXPECTED_TOOL_NAMES = [
  "get_team",
  "get_player_stats",
  "compare_players",
  "get_fixtures",
  "get_squad",
  "suggest_captain",
  "suggest_transfer",
  "get_mini_league",
  "get_chart_data",
];

let prism: ChildProcessWithoutNullStreams;
let mcpHttpServer: Server;
let client: Client;
let originalBaseUrl: string | undefined;

function startPrism(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["--yes", "@stoplight/prism-cli", "mock", "openapi.yaml", "-p", "0"], {
      cwd: REPO_ROOT,
    });
    prism = child;

    let output = "";
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      const match = output.match(/Prism is listening on (http:\/\/[^\s]+)/);
      if (match) {
        child.stdout.off("data", onData);
        resolve(match[1]);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`Prism exited early (code ${code}):\n${output}`));
      }
    });
  });
}

function startMcpServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createHttpServer((req, res) => {
      if (req.method !== "POST" || req.url !== "/mcp") {
        res.writeHead(404).end();
        return;
      }
      handleMcpRequest(req, res).catch((err) => {
        if (!res.headersSent) {
          res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "Invalid request" }));
        }
        console.error("Error handling MCP request:", err);
      });
    });
    mcpHttpServer = server;
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("Expected server to bind to a TCP port"));
        return;
      }
      resolve(address.port);
    });
  });
}

beforeAll(async () => {
  originalBaseUrl = process.env.FPL_API_BASE_URL;

  const prismUrl = await startPrism();
  process.env.FPL_API_BASE_URL = prismUrl;

  const mcpPort = await startMcpServer();

  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${mcpPort}/mcp`));
  client = new Client({ name: "e2e-test-client", version: "0.0.0" });
  await client.connect(transport);
}, 30_000);

afterAll(async () => {
  await client?.close();
  await new Promise<void>((resolve) => mcpHttpServer.close(() => resolve()));

  prism.kill();
  await new Promise<void>((resolve) => prism.once("exit", () => resolve()));

  process.env.FPL_API_BASE_URL = originalBaseUrl;
}, 30_000);

describe("MCP server end-to-end over Streamable HTTP", () => {
  it("lists exactly the 9 MVP tools, no more, no less", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();

    expect(names).toEqual([...EXPECTED_TOOL_NAMES].sort());
  });

  it("calls get_team end-to-end and gets Prism's example back", async () => {
    const result = await client.callTool({ name: "get_team", arguments: { team_id: "1234567" } });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const body = JSON.parse(content[0].text);
    expect(body).toEqual({
      team_id: 1234567,
      name: "Fantasy Wanderers",
      manager_name: "A. Manager",
      overall_rank: 154032,
      total_points: 412,
      data_as_of: "2026-09-06T09:00:00Z",
      stale: false,
    });
  });

  it("calls suggest_captain end-to-end and gets a RecommendationContract-shaped result", async () => {
    const result = await client.callTool({ name: "suggest_captain", arguments: { team_id: "1234567" } });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    const body = JSON.parse(content[0].text);
    expect(body).toMatchObject({
      recommendation: { player_id: 302, name: "M. Salah" },
      confidence: "high",
      reasoning: expect.any(Array),
      alternatives: expect.any(Array),
    });
  });
});
