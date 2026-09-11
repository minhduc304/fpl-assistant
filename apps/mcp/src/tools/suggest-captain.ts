import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's suggestCaptain operation — a contract
 * revision touching this param must update both places.
 */
const inputSchema = { team_id: z.string(), gameweek: z.number().int().optional() };

export function registerSuggestCaptain(server: McpServer): void {
  server.registerTool(
    "suggest_captain",
    {
      description: "Suggest a captain for the given team, with reasoning and alternatives.",
      inputSchema,
    },
    async ({ team_id, gameweek }) => {
      const result = await callRailsTool((client) =>
        client.GET("/teams/{teamId}/suggest-captain", {
          params: {
            path: { teamId: Number(team_id) },
            query: gameweek !== undefined ? { gameweek } : {},
          },
        })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
