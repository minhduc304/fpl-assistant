// Regenerates src/generated/output-schemas.ts from openapi.yaml.
//
// Each MCP tool's response shape should be the same contract Rails already
// promises in openapi.yaml, not a hand-maintained second copy -- so this
// script walks each tool's operationId to its 200 response schema, resolves
// any internal $ref (openapi.yaml has no external refs, so this does not
// need to be a general-purpose resolver), translates OpenAPI's `nullable:
// true` into the `type: [..., "null"]` form plain JSON Schema uses, and
// hands the result to json-schema-to-zod to produce real Zod source.
//
// Run: npm run generate --workspace=apps/mcp

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { jsonSchemaToZod } from "json-schema-to-zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENAPI_PATH = path.resolve(__dirname, "../../../openapi.yaml");
const OUTPUT_PATH = path.resolve(__dirname, "../src/generated/output-schemas.ts");

// MCP tool name -> openapi.yaml operationId. Hand-maintained: a new tool
// needs one line here, same as it needs one line in a register-*-tools.ts file.
const TOOL_OPERATIONS: Record<string, string> = {
  get_team: "getTeam",
  get_squad: "getSquad",
  get_player_stats: "getPlayerStats",
  compare_players: "comparePlayers",
  get_fixtures: "getFixtures",
  suggest_captain: "suggestCaptain",
  suggest_transfer: "suggestTransfer",
  get_mini_league: "getMiniLeagueStandings",
  get_chart_data: "getChartData",
};

type JsonObject = Record<string, unknown>;

function findOperation(doc: JsonObject, operationId: string): JsonObject {
  const paths = doc.paths as Record<string, JsonObject>;
  for (const pathItem of Object.values(paths)) {
    for (const operation of Object.values(pathItem)) {
      if (operation && typeof operation === "object" && (operation as JsonObject).operationId === operationId) {
        return operation as JsonObject;
      }
    }
  }
  throw new Error(`No operation found for operationId "${operationId}"`);
}

function resolveRef(ref: string, doc: JsonObject): unknown {
  const target = ref
    .replace(/^#\//, "")
    .split("/")
    .reduce<unknown>((node, key) => (node as JsonObject | undefined)?.[key], doc);
  if (target === undefined) throw new Error(`Could not resolve $ref: ${ref}`);
  return target;
}

// Inlines every $ref and rewrites OpenAPI's `nullable: true` into plain JSON
// Schema's `type: [..., "null"]`, which json-schema-to-zod understands.
function resolveSchema(schema: unknown, doc: JsonObject, seenRefs: ReadonlySet<string> = new Set()): unknown {
  if (schema === null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map((item) => resolveSchema(item, doc, seenRefs));

  const obj = schema as JsonObject;
  if (typeof obj.$ref === "string") {
    if (seenRefs.has(obj.$ref)) throw new Error(`Circular $ref detected: ${obj.$ref}`);
    return resolveSchema(resolveRef(obj.$ref, doc), doc, new Set(seenRefs).add(obj.$ref));
  }

  const resolved: JsonObject = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "nullable") continue;
    resolved[key] = resolveSchema(value, doc, seenRefs);
  }
  if (obj.nullable === true) {
    const existingType = resolved.type;
    resolved.type = Array.isArray(existingType) ? [...existingType, "null"] : [existingType, "null"];
  }
  return resolved;
}

function responseSchema(operation: JsonObject): unknown {
  const responses = operation.responses as JsonObject;
  const ok = responses?.["200"] as JsonObject | undefined;
  const schema = (ok?.content as JsonObject | undefined)?.["application/json"] as JsonObject | undefined;
  if (!schema?.schema) throw new Error(`Operation "${operation.operationId}" has no 200 JSON response schema`);
  return schema.schema;
}

function main(): void {
  const doc = parse(readFileSync(OPENAPI_PATH, "utf8")) as JsonObject;

  const entries = Object.entries(TOOL_OPERATIONS).map(([toolName, operationId]) => {
    const operation = findOperation(doc, operationId);
    const resolved = resolveSchema(responseSchema(operation), doc);
    const zodExpression = jsonSchemaToZod(resolved as object, { module: "none" });
    return { toolName, operationId, zodExpression };
  });

  const header = [
    "// GENERATED FILE -- do not edit by hand.",
    "// Regenerate with: npm run generate --workspace=apps/mcp",
    "// Source: each tool's response schema in openapi.yaml, keyed by operationId below.",
    `import { z } from "zod";`,
    "",
  ].join("\n");

  const schemaConstants = entries
    .map(({ toolName, operationId, zodExpression }) => `// ${operationId}\nconst ${toolName}Schema = ${zodExpression};`)
    .join("\n\n");

  const outputMap = [
    "",
    "export const outputSchemas = {",
    ...entries.map(({ toolName }) => `  ${toolName}: ${toolName}Schema,`),
    "} as const;",
    "",
  ].join("\n");

  writeFileSync(OUTPUT_PATH, `${header}\n${schemaConstants}\n${outputMap}`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
