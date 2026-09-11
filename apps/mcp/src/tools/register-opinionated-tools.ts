import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSuggestCaptain } from "./suggest-captain.js";
import { registerSuggestTransfer } from "./suggest-transfer.js";

/** Registers the opinionated tools: suggest_captain, suggest_transfer. */
export function registerOpinionatedTools(server: McpServer): void {
  registerSuggestCaptain(server);
  registerSuggestTransfer(server);
}
