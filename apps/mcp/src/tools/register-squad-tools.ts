import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetSquad } from "./get-squad.js";

/** Registers the squad-related tools: get_squad. */
export function registerSquadTools(server: McpServer): void {
  registerGetSquad(server);
}
