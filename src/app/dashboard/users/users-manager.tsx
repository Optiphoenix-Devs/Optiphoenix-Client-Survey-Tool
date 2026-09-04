"use client";

import { useMemo, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { toast } from "@/components/ui/toaster";
import { Select, SortByOption } from "@/components/ui/select";
import { Spinner } from "@/components/ui/pending-button";
import { formatMonthYear } from "@/lib/format";
import { TableHeadLeft, TableCellLeft } from "@/components/directory/directory-table";
import {
  DIRECTORY_SORT_OPTIONS,
  DIRECTORY_SORT_SELECTION_VALUES,
  sortDirectoryRows,
  type DirectorySort,
} from "@/lib/sort";
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
  const [sort, setSort] = usePersistedValue(
    "optiphoenix.usersSort.v2",
    "",
    DIRECTORY_SORT_SELECTION_VALUES
  );
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Approve new accounts and unlock lockouts. People can reset their own
            password without waiting for you.
          </p>
        </div>
        <label className="w-full min-w-0 sm:w-[11.5rem] sm:shrink-0">
          <span className="sr-only">Sort by</span>
          <Select
            value={sort}
            onChange={(event) => {
              const next = event.target.value;
              if (!next) return;
              setSort(next as DirectorySort);
            }}
            aria-label="Sort by"
            className="w-full"
          >
            <SortByOption />
            {DIRECTORY_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {resetUrl ? (
        <div className="mt-4 app-radius border border-sage bg-card p-4">
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

      <ul className="mt-6 flex flex-col gap-3 md:hidden">
        {visible.map((user) => (
          <li
            key={user.id}
            className="app-radius border border-border bg-card p-4 app-shadow-card"
          >
            <p className="font-medium">{user.name}</p>
            <p className="mt-0.5 break-all text-xs text-muted">{user.email}</p>
            <p className="mt-3 text-sm">
              {user.role === "ADMIN" ? "Admin" : "Team Lead"} · {user.status}
              {user.lockedUntil ? " · Locked" : ""}
              {user.resetRequested ? " · Reset requested" : ""}
            </p>
            <p className="mt-1 text-xs text-muted">{formatMonthYear(user.createdAt)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {pending ? <Spinner className="text-muted" /> : null}
              {user.status === "PENDING" ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        approveAction,
                        user.id,
                        "Account approved. They will be signed in if they kept the waiting page open."
                      )
                    }
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
                  onClick={() => run(resetLinkAction, user.id, "Reset link created")}
                  className="text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Reset link
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="directory-table-wrap card-enter mt-6 hidden md:block">
        <table className="directory-table w-full min-w-[48rem] text-sm">
          <thead>
            <tr>
              <TableHeadLeft className="w-[28%]">User</TableHeadLeft>
              <TableHeadLeft className="w-[14%]">Role</TableHeadLeft>
              <TableHeadLeft className="w-[22%]">Status</TableHeadLeft>
              <TableHeadLeft className="w-[14%]">Created</TableHeadLeft>
              <TableHeadLeft className="w-[22%]">Actions</TableHeadLeft>
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <TableCellLeft>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </TableCellLeft>
                <TableCellLeft>{user.role === "ADMIN" ? "Admin" : "Team Lead"}</TableCellLeft>
                <TableCellLeft>
                  <p>{user.status}</p>
                  {user.lockedUntil ? (
                    <p className="text-xs text-rose-800">Locked</p>
                  ) : null}
                  {user.resetRequested ? (
                    <p className="text-xs text-accent">Reset requested</p>
                  ) : null}
                </TableCellLeft>
                <TableCellLeft className="whitespace-nowrap text-muted">
                  {formatMonthYear(user.createdAt)}
                </TableCellLeft>
                <TableCellLeft>
                  <div className="flex flex-wrap items-center gap-2">
                    {pending ? <Spinner className="text-muted" /> : null}
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
                </TableCellLeft>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
