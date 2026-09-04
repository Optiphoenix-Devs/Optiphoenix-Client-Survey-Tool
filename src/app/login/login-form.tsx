"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionButton } from "@/components/ui/pending-button";
import { toast, toastOnce } from "@/components/ui/toaster";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, {});

  useEffect(() => {
    if (!notice) return;
    const message =
      notice === "signed-out-elsewhere"
        ? "You were signed out because you logged in on another device."
        : notice.replaceAll("+", " ");
    toastOnce(`login-notice:${notice}`, message, {
      tone: notice === "signed-out-elsewhere" ? "info" : "success",
    });
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
            placeholder="you@company.com"
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
          <PasswordInput autoComplete="current-password" placeholder="Enter your password" />
        </label>
        <ActionButton
          pending={pending}
          className="app-btn-primary px-4 py-2.5 text-sm"
        >
          Login
        </ActionButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New Member?{" "}
        <Link href="/create-account" className="font-medium text-accent hover:text-accent-hover">
          Create account
        </Link>
      </p>
    </>
  );
}
