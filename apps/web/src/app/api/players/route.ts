import { NextResponse } from "next/server";
import { callRailsApi, RailsApiError } from "@/lib/api";

const POSITIONS = ["GKP", "DEF", "MID", "FWD"] as const;
type Position = (typeof POSITIONS)[number];

function parsePosition(value: string | null): Position | undefined {
  return POSITIONS.includes(value as Position) ? (value as Position) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? undefined;
  const position = parsePosition(searchParams.get("position"));
  const team = searchParams.get("team") ?? undefined;

  try {
    const result = await callRailsApi((client) =>
      client.GET("/players", { params: { query: { query, position, team } } })
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RailsApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
