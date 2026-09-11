import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetMiniLeague } from "./get-mini-league.js";
import { registerGetChartData } from "./get-chart-data.js";

/** Registers the standings/charts tools: get_mini_league, get_chart_data. */
export function registerStandingsChartsTools(server: McpServer): void {
  registerGetMiniLeague(server);
  registerGetChartData(server);
}
