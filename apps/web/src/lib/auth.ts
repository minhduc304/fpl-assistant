import "server-only";
import { cookies } from "next/headers";
import { getApiClient, RailsApiError } from "@/lib/api";

export const SESSION_COOKIE = "fpl_session";

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<{ email: string; fpl_team_id: number } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const client = getApiClient();
  const { data, error, response } = await client.GET("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) return null;
    throw new RailsApiError(
      error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "The FPL Assistant API returned an error.",
      response.status
    );
  }
  if (!data?.email || data.fpl_team_id == null) return null;
  return { email: data.email, fpl_team_id: data.fpl_team_id };
}
