import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetFixtures } from "./get-fixtures.js";

/** Registers the fixtures-related tools: get_fixtures. */
export function registerFixturesTools(server: McpServer): void {
  registerGetFixtures(server);
}
