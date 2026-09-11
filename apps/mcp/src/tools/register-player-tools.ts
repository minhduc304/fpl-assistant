import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerComparePlayers } from "./compare-players.js";
import { registerGetPlayerStats } from "./get-player-stats.js";

/** Registers the player-related tools: get_player_stats, compare_players. */
export function registerPlayerTools(server: McpServer): void {
  registerGetPlayerStats(server);
  registerComparePlayers(server);
}
