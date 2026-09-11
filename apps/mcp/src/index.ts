import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
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

const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
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
});

httpServer.listen(PORT, () => {
  console.log(`FPL Assistant MCP server listening on http://localhost:${PORT}/mcp`);
});
