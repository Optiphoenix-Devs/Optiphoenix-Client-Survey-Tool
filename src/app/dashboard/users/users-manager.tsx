"use client";

import { useMemo, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { toast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";
import { formatMonthYear } from "@/lib/format";
import { DIRECTORY_SORT_OPTIONS, sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { usePersistedValue } from "@/lib/use-persisted-value";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEAM_LEAD";
  status: "PENDING" | "APPROVED" | "REJECTED";
  lockedUntil: string | null;
  resetRequested: boolean;
  isSelf: boolean;
  createdAt: string;
};

export function UsersManager({
  users,
  approveAction,
  rejectAction,
  unlockAction,
  resetLinkAction,
}: {
  users: AdminUserRow[];
  approveAction: (formData: FormData) => Promise<ActionResult>;
  rejectAction: (formData: FormData) => Promise<ActionResult>;
  unlockAction: (formData: FormData) => Promise<ActionResult>;
  resetLinkAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [sort, setSort] = usePersistedValue("optiphoenix.usersSort", "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);
  const visible = useMemo(
    () =>
      sortDirectoryRows(
        users,
        sort,
        (user) => user.createdAt,
        (user) => user.name
      ),
    [users, sort]
  );

  function run(
    action: (formData: FormData) => Promise<ActionResult>,
    userId: string,
    success: string
  ) {
    const formData = new FormData();
    formData.set("userId", userId);
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
        toast("Reset link created. Copy it and send it to that user only.", {
          tone: "success",
        });
        return;
      }
      toast(success, { tone: "success" });
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Approve new accounts and unlock lockouts. People can reset their own
            password without waiting for you.
          </p>
        </div>
        <label className="w-[11.5rem] shrink-0">
          <span className="sr-only">Sort by</span>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as DirectorySort)}
            aria-label="Sort by"
            className="rounded-full py-2"
          >
            {DIRECTORY_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {resetUrl ? (
        <div className="mt-4 rounded-xl border border-sage bg-card p-4">
          <p className="text-sm font-medium">Latest reset link</p>
          <p className="mt-1 break-all text-xs text-muted">{resetUrl}</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
            onClick={() => {
              void navigator.clipboard.writeText(resetUrl);
              toast("Copied", { tone: "success" });
            }}
          >
            Copy link
          </button>
        </div>
      ) : null}

      <div className="card-enter mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </td>
                <td className="px-4 py-3">{user.role === "ADMIN" ? "Admin" : "Team Lead"}</td>
                <td className="px-4 py-3">
                  <p>{user.status}</p>
                  {user.lockedUntil ? (
                    <p className="text-xs text-rose-800">Locked</p>
                  ) : null}
                  {user.resetRequested ? (
                    <p className="text-xs text-accent">Reset requested</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {formatMonthYear(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {user.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(approveAction, user.id, "Account approved. They will be signed in if they kept the waiting page open.")}
                          className="text-sm font-medium text-accent hover:text-accent-hover"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(rejectAction, user.id, "Account rejected")}
                          className="text-sm font-medium text-rose-800"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {user.lockedUntil ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(unlockAction, user.id, "Account unlocked")}
                        className="text-sm font-medium text-accent hover:text-accent-hover"
                      >
                        Unlock
                      </button>
                    ) : null}
                    {user.status === "APPROVED" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(resetLinkAction, user.id, "Reset link created")
                        }
                        className="text-sm font-medium text-accent hover:text-accent-hover"
                      >
                        Reset link
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
