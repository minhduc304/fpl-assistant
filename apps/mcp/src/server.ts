import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { registerPlayerTools } from "./tools/register-player-tools.js";
import { registerTeamTools } from "./tools/register-team-tools.js";
import { registerOpinionatedTools } from "./tools/register-opinionated-tools.js";
import { registerFixturesTools } from "./tools/register-fixtures-tools.js";
import { registerStandingsChartsTools } from "./tools/register-standings-charts-tools.js";
import { registerSquadTools } from "./tools/register-squad-tools.js";

/**
 * Builds the MCP server instance. Tool registration happens in Tasks 43-48.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "fpl-assistant-mcp", version: "0.0.0" });

  registerPlayerTools(server); // Task 43
  registerTeamTools(server); // Task 44
  registerOpinionatedTools(server); // Task 45
  registerFixturesTools(server); // Task 46
  registerStandingsChartsTools(server); // Task 47
  registerSquadTools(server); // Task 48

  return server;
}

/**
 * Handles one Streamable HTTP request against a fresh, stateless transport.
 * No session store, no held-open SSE state: a new McpServer + transport pair
 * is created and torn down per request, matching the "no per-connection state
 * to keep" MVP decision (Phase 12 Planning Note).
 */
export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  parsedBody?: unknown
): Promise<void> {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
}
