import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's getSquad operation — a contract
 * revision touching this param must update both places.
 */
const inputSchema = { team_id: z.string() };

export function registerGetSquad(server: McpServer): void {
  server.registerTool(
    "get_squad",
    {
      description: "Get a team's current 15-player squad, formation, and captain/vice-captain picks.",
      inputSchema,
    },
    async ({ team_id }) => {
      const result = await callRailsTool((client) =>
        client.GET("/teams/{teamId}/squad", { params: { path: { teamId: Number(team_id) } } })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
