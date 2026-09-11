import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's getFixtures operation — a contract
 * revision touching these params must update both places.
 */
const inputSchema = { gameweek: z.number().int().optional(), team_id: z.string().optional() };

export function registerGetFixtures(server: McpServer): void {
  server.registerTool(
    "get_fixtures",
    {
      description: "Get fixture difficulty ratings, including double/blank gameweek flags.",
      inputSchema,
    },
    async ({ gameweek, team_id }) => {
      const query: { gameweek?: number; teamId?: number } = {};
      if (gameweek !== undefined) query.gameweek = gameweek;
      if (team_id !== undefined) query.teamId = Number(team_id);

      const result = await callRailsTool((client) => client.GET("/fixtures", { params: { query } }));

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
