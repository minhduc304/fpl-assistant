import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callRailsTool, isErrorResult } from "../rails-tool.js";

/**
 * Hand-synced to openapi.yaml's suggestTransfer operation — a contract
 * revision touching this param must update both places. Defaulting an
 * omitted `risk_tolerance` is Rails' job (defaults to "balanced" there),
 * not the MCP layer's — so it's only sent when the caller provides it.
 */
const inputSchema = {
  team_id: z.string(),
  risk_tolerance: z.enum(["safe", "balanced", "differential"]).optional(),
};

export function registerSuggestTransfer(server: McpServer): void {
  server.registerTool(
    "suggest_transfer",
    {
      description: "Suggest a transfer for the given team, with reasoning and alternatives.",
      inputSchema,
    },
    async ({ team_id, risk_tolerance }) => {
      const result = await callRailsTool((client) =>
        client.GET("/teams/{teamId}/suggest-transfer", {
          params: {
            path: { teamId: Number(team_id) },
            query: risk_tolerance !== undefined ? { risk_tolerance } : {},
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
