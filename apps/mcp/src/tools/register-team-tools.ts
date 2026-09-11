import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetTeam } from "./get-team.js";

/** Registers the team-related tools: get_team. */
export function registerTeamTools(server: McpServer): void {
  registerGetTeam(server);
}
