import { NextResponse } from "next/server";
import { callRailsApi, RailsApiError } from "@/lib/api";

export async function GET() {
  try {
    const result = await callRailsApi((client) => client.GET("/players/teams"));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RailsApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
