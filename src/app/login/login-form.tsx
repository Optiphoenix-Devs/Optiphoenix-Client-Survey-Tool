"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import { PasswordInput } from "@/components/ui/password-input";
import { toast, toastOnce } from "@/components/ui/toaster";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});

  useEffect(() => {
    if (notice) {
      toastOnce(`login-notice:${notice}`, notice.replaceAll("+", " "), {
        tone: "success",
      });
    }
  }, [notice]);

  useEffect(() => {
    if (state.error) {
      toast("Sign in failed", { description: state.error, tone: "error" });
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
            placeholder="email@example.com"
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
              Forgot password?
            </Link>
          </span>
          <PasswordInput autoComplete="current-password" placeholder="********" />
        </label>
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
