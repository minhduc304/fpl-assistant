import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's getChartData operation — a contract
 * revision touching these params must update both places.
 *
 * `type` is required, with no default: it selects fundamentally different
 * data with no safe fallback (mirrors Rails' own `400` on a missing/invalid
 * `type`, contract v1.4.0). zod rejects a missing/invalid value before the
 * call is even made.
 */
const inputSchema = {
  team_id: z.string(),
  type: z.enum(["points_per_gameweek", "rank_trajectory", "price_history"]),
};

export function registerGetChartData(server: McpServer): void {
  server.registerTool(
    "get_chart_data",
    {
      description: "Get time-series chart data for a team: points per gameweek, rank trajectory, or price history.",
      inputSchema,
    },
    async ({ team_id, type }) => {
      const result = await callRailsTool((client) =>
        client.GET("/teams/{teamId}/charts", { params: { path: { teamId: Number(team_id) }, query: { type } } })
      );

      if (isErrorResult(result)) {
        return result;
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
