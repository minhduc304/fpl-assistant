import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's comparePlayers operation — a contract
 * revision touching this param must update both places.
 *
 * `.min(2)` mirrors the Rails controller's own "< 2 players" rule as a
 * client-side hint; Rails still owns the actual validation and error message.
 */
const inputSchema = { player_ids: z.array(z.string()).min(2) };

export function registerComparePlayers(server: McpServer): void {
  server.registerTool(
    "compare_players",
    {
      description: "Side-by-side comparison of two or more players.",
      inputSchema,
    },
    async ({ player_ids }) => {
      const result = await callRailsTool((client) =>
        client.GET("/players/compare", { params: { query: { playerIds: player_ids.join(",") } } })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
