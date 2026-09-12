import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { handleMcpRequest } from "./server.js";

const PORT = Number(process.env.PORT ?? 3100);

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export async function requestListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/mcp") {
    res.writeHead(404).end();
    return;
  }

  try {
    const body = await readBody(req);
    await handleMcpRequest(req, res, body);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(400, { "content-type": "application/json" }).end(
        JSON.stringify({ error: "Invalid request" })
      );
    }
    console.error("Error handling MCP request:", err);
  }
}

const httpServer = createHttpServer(requestListener);

// Only bind the port when this file is the process entrypoint (dev via tsx,
// production via `node dist/index.js`) — not when a test imports
// `requestListener` and would otherwise contend for the same PORT.
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  httpServer.listen(PORT, () => {
    console.log(`FPL Assistant MCP server listening on http://localhost:${PORT}/mcp`);
  });
}
