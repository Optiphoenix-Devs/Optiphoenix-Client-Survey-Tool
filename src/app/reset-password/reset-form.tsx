"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "../login/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { toast, toastOnce } from "@/components/ui/toaster";
import Link from "next/link";

let passwordResetSucceeded = false;
let passwordResetRedirectAt = 0;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(resetPasswordAction, {});
  const redirecting = Boolean(state.ok) || passwordResetSucceeded;

  useEffect(() => {
    if (state.error) {
      toast("Could not update password", {
        description: state.error,
        tone: "error",
      });
    }
  }, [state.error]);

  useEffect(() => {
    if (state.ok) passwordResetSucceeded = true;
    if (!passwordResetSucceeded) return;

    toastOnce("password-updated", "Password updated", {
      description: "You can sign in now.",
      tone: "success",
      durationMs: 5000,
    });
    if (!passwordResetRedirectAt) {
      passwordResetRedirectAt = Date.now() + 5000;
    }
    const remaining = Math.max(0, passwordResetRedirectAt - Date.now());
    const id = window.setTimeout(() => {
      router.push("/login");
    }, remaining);
    return () => window.clearTimeout(id);
  }, [state.ok, router]);

  if (!token) {
    return (
      <p className="mt-4 text-sm text-muted">
        This reset link is missing. Ask an admin for a new one.
      </p>
    );
  }

  const busy = pending || redirecting;

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        New password
        <PasswordInput autoComplete="new-password" placeholder="********" />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
      >
        {redirecting
          ? "Taking you to login…"
          : pending
            ? "Updating…"
            : "Set new password"}
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
