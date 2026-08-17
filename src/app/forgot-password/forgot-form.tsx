"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "../login/actions";
import { toast } from "@/components/ui/toaster";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, {});

  useEffect(() => {
    if (!state.error) return;
    const pending = state.error.toLowerCase().includes("approved by the admin");
    toast(pending ? "Please wait" : "Could not continue", {
      description: state.error,
      tone: pending ? "info" : "error",
    });
  }, [state.error]);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Continuing…" : "Continue"}
      </button>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-background"
      >
        Back to login
      </Link>
    </form>
  );
}
