"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { createAccountAction } from "../login/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionButton } from "@/components/ui/pending-button";
import { toast } from "@/components/ui/toaster";

export function CreateAccountForm() {
  const [state, action, pending] = useActionState(createAccountAction, {});

  useEffect(() => {
    if (state.error) {
      toast("Could not create account", {
        description: state.error,
        tone: "error",
      });
    }
  }, [state.error]);

  return (
    <>
      <form action={action} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Name
          <input
            name="name"
            required
            minLength={2}
            placeholder="Jane Doe"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
          />
        </label>
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
          Password
          <PasswordInput autoComplete="new-password" showStrength placeholder="Create a strong password" />
        </label>
        <ActionButton
          pending={pending}
          className="app-btn-primary px-4 py-2.5 text-sm"
        >
          Create account
        </ActionButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Login
        </Link>
      </p>
    </>
  );
}
