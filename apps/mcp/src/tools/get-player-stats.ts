import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's getPlayerStats operation — a contract
 * revision touching this param must update both places.
 */
const inputSchema = { player_id: z.string() };

export function registerGetPlayerStats(server: McpServer): void {
  server.registerTool(
    "get_player_stats",
    {
      description: "Get a single player's stats (price, points, form, and other stats).",
      inputSchema,
    },
    async ({ player_id }) => {
      const result = await callRailsTool((client) =>
        client.GET("/players/{playerId}", { params: { path: { playerId: Number(player_id) } } })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
