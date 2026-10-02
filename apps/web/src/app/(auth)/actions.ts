"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth";

export type AuthFormState = { error: string } | null;

async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Something went wrong, please try again.";
}

export async function signUpAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fplTeamId = Number(formData.get("fpl_team_id"));

  const client = getApiClient();
  const { data, error, response } = await client.POST("/sign_up", {
    body: { email, password, fpl_team_id: fplTeamId },
  });

  if (!response.ok || !data) {
    return { error: errorMessage(error) };
  }

  await setSessionCookie(data.token);
  redirect("/dashboard");
}

export async function logInAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const client = getApiClient();
  const { data, error, response } = await client.POST("/sessions", {
    body: { email, password },
  });

  if (!response.ok || !data) {
    return { error: errorMessage(error) };
  }

  await setSessionCookie(data.token);
  redirect("/dashboard");
}

export async function logOutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    const client = getApiClient();
    await client.DELETE("/sessions", { headers: { Authorization: `Bearer ${token}` } });
  }

  store.delete(SESSION_COOKIE);
  redirect("/log-in");
}
