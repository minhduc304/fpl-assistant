import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's getMiniLeagueStandings operation — a contract
 * revision touching this param must update both places.
 */
const inputSchema = { league_id: z.string() };

export function registerGetMiniLeague(server: McpServer): void {
  server.registerTool(
    "get_mini_league",
    {
      description: "Get the current standings table for a public FPL mini-league.",
      inputSchema,
    },
    async ({ league_id }) => {
      const result = await callRailsTool((client) =>
        client.GET("/mini-leagues/{leagueId}/standings", { params: { path: { leagueId: Number(league_id) } } })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
