"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import { toast } from "@/components/ui/toaster";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});

  useEffect(() => {
    if (notice) {
      toast(notice.replaceAll("+", " "), { tone: "success" });
    }
  }, [notice]);

  useEffect(() => {
    if (state.error) {
      toast(state.error, { tone: "error" });
    }
  }, [state.error]);

  return (
    <>
      <form action={action} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="m@example.com"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          <span className="flex items-center justify-between gap-2">
            Password
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent hover:text-accent-hover"
            >
              Forgot your password?
            </Link>
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
          />
        </label>
        {state.error ? (
          <p className="rounded-lg border border-rose-700 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Login"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New Member?{" "}
        <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
          Create account
        </Link>
      </p>
    </>
  );
}
