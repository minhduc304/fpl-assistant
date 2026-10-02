"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logInAction, type AuthFormState } from "../actions";
import { Field } from "../field";

export default function LogInPage() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(logInAction, null);

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-heading uppercase" style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", lineHeight: 0.95 }}>
          Log in
        </h1>

        <form action={formAction} className="flex flex-col gap-3" noValidate>
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field label="Password" name="password" type="password" autoComplete="current-password" />

          {state?.error ? (
            <div role="alert" className="rounded-[3px] border px-2.5 py-2 font-numeral text-sm" style={{ color: "var(--destructive)", borderColor: "var(--destructive)" }}>
              {state.error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 w-full rounded-[2px] font-numeral text-xs font-bold tracking-wide uppercase transition-[filter] duration-100 hover:brightness-[1.06] active:brightness-[0.94] disabled:opacity-60"
            style={{ backgroundColor: "var(--accent)", color: "var(--background)" }}
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="font-numeral text-sm" style={{ color: "var(--muted-foreground)" }}>
          No account yet?{" "}
          <Link href="/sign-up" className="underline" style={{ color: "var(--foreground)" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
