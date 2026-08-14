"use client";

import { useActionState, useEffect } from "react";
import { resetPasswordAction } from "../login/actions";
import { toast } from "@/components/ui/toaster";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {});

  useEffect(() => {
    if (state.error) toast(state.error, { tone: "error" });
  }, [state.error]);

  if (!token) {
    return (
      <p className="mt-4 text-sm text-muted">
        This reset link is missing. Ask an admin for a new one.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        New password
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
