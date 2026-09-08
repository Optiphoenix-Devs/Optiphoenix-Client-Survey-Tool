"use client";

import { useActionState, useEffect } from "react";
import { acceptTeamInvite } from "./actions";
import { PasswordInput } from "@/components/ui/password-input";
import { ActionButton } from "@/components/ui/pending-button";
import { toast } from "@/components/ui/toaster";

export function InviteJoinForm({
  token,
  email,
  defaultName,
  isExistingUser,
}: {
  token: string;
  email: string;
  defaultName?: string;
  isExistingUser: boolean;
}) {
  const [state, action, pending] = useActionState(acceptTeamInvite, {});

  useEffect(() => {
    if (state.error) {
      toast("Could not join", { description: state.error, tone: "error" });
    }
  }, [state.error]);

  if (isExistingUser) {
    return (
      <form action={action} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="name" value={defaultName || email} />
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email
          <input
            type="email"
            value={email}
            readOnly
            className="rounded-lg border border-border bg-hover px-3 py-2.5 text-sm text-muted outline-none"
          />
        </label>
        <p className="text-sm text-muted">
          You already have an OptiPhoenix account. Join this team, then sign in
          with your existing password.
        </p>
        <ActionButton
          pending={pending}
          className="app-btn-primary px-4 py-2.5 text-sm"
        >
          Join Team
        </ActionButton>
      </form>
    );
  }

  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input
          type="email"
          value={email}
          readOnly
          className="rounded-lg border border-border bg-hover px-3 py-2.5 text-sm text-muted outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Your name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="Full name"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Create password
        <PasswordInput
          autoComplete="new-password"
          showStrength
          minLength={8}
          placeholder="Create a strong password"
        />
      </label>
      <ActionButton
        pending={pending}
        className="app-btn-primary px-4 py-2.5 text-sm"
      >
        Join Team
      </ActionButton>
    </form>
  );
}
