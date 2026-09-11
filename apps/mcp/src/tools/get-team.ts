import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's getTeam operation — a contract
 * revision touching this param must update both places.
 */
const inputSchema = { team_id: z.string() };

export function registerGetTeam(server: McpServer): void {
  server.registerTool(
    "get_team",
    {
      description: "Get a single FPL team's summary (manager, overall rank, total points).",
      inputSchema,
    },
    async ({ team_id }) => {
      const result = await callRailsTool((client) =>
        client.GET("/teams/{teamId}", { params: { path: { teamId: Number(team_id) } } })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
