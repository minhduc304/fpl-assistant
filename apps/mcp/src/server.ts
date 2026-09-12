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
 * Builds the MCP server instance.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "fpl-assistant-mcp", version: "0.0.0" });

  registerPlayerTools(server);
  registerTeamTools(server);
  registerOpinionatedTools(server);
  registerFixturesTools(server);
  registerStandingsChartsTools(server);
  registerSquadTools(server);

  return server;
}

/**
 * Handles one Streamable HTTP request against a fresh, stateless transport.
 * No session store, no held-open SSE state: a new McpServer + transport pair
 * is created and torn down per request — deliberately no per-connection state
 * to keep for the MVP.
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
