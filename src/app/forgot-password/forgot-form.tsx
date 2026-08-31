"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "../login/actions";
import { ActionButton } from "@/components/ui/pending-button";
import { toast } from "@/components/ui/toaster";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, {});

  useEffect(() => {
    if (!state.error) return;
    const waiting = state.error.toLowerCase().includes("approved by the admin");
    toast(waiting ? "Please wait" : "Could not continue", {
      description: state.error,
      tone: waiting ? "info" : "error",
    });
  }, [state.error]);

  if (state.ok) {
    return (
      <div className="mt-6 space-y-4">
        <div className="app-radius border border-border bg-surface px-4 py-4 text-sm leading-6">
          <p className="font-semibold">Check your email</p>
          <p className="mt-1 text-muted">
            If an account exists for that address, we sent a password reset link.
            Open the link from your inbox to choose a new password. The link expires
            in one hour.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-background"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <p className="text-sm leading-6 text-muted">
        Enter your account email. We’ll send a reset link — we never open the reset
        page from this screen, so only someone with inbox access can change the
        password.
      </p>
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
      <ActionButton
        pending={pending}
        className="app-btn-primary px-4 py-2.5 text-sm"
      >
        Send reset link
      </ActionButton>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-background"
      >
        Back to login
      </Link>
    </form>
  );
}
