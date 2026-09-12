import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requestListener } from "./index.js";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(requestListener);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected server to bind to a TCP port");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("GET /health", () => {
  it("returns 200 with a JSON ok body", async () => {
    const res = await fetch(`${baseUrl}/health`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});

describe("unrecognized routes", () => {
  it("still 404s (no regression from adding /health)", async () => {
    const res = await fetch(`${baseUrl}/nope`);

    expect(res.status).toBe(404);
  });
});
