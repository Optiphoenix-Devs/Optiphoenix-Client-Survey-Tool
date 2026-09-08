"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardList,
  Lock,
  LockOpen,
  Mail,
  ShieldOff,
  UserCheck,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { toast } from "@/components/ui/toaster";
import { Select, SortByOption } from "@/components/ui/select";
import { ActionButton } from "@/components/ui/pending-button";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import {
  TableHeadLeft,
  TableHeadCenter,
  TableCellLeft,
  TableCellCenter,
} from "@/components/directory/directory-table";
import {
  TableActionsCell,
  TableActionsHeader,
} from "@/components/ui/table-actions";
import {
  DIRECTORY_SORT_OPTIONS,
  DIRECTORY_SORT_PLACEHOLDER,
  DIRECTORY_SORT_SELECTION_VALUES,
  sortDirectoryRows,
  type DirectorySort,
} from "@/lib/sort";
import { usePersistedValue } from "@/lib/use-persisted-value";

type AccountStatus = "PENDING" | "APPROVED" | "REJECTED" | "DEACTIVATED";
type AccessLevel = "VIEW" | "SHARE" | "FULL";

type TeamMembershipRow = {
  id: string;
  name: string;
  accessLevel: AccessLevel;
  revokedAt: string | null;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEAM_LEAD";
  status: AccountStatus;
  lockedUntil: string | null;
  createdAt: string;
  teams: TeamMembershipRow[];
};

type TeamOption = { id: string; name: string };

function statusLabel(status: AccountStatus) {
  if (status === "APPROVED") return "Active";
  if (status === "DEACTIVATED") return "Deactivated";
  if (status === "PENDING") return "Pending";
  return "Rejected";
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const label = statusLabel(status);
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        status === "APPROVED" && "bg-emerald-100 text-emerald-800",
        status === "DEACTIVATED" && "bg-zinc-200 text-zinc-700",
        status === "PENDING" && "bg-amber-100 text-amber-900",
        status === "REJECTED" && "bg-rose-100 text-rose-800"
      )}
    >
      {label}
    </span>
  );
}

export function UsersManager({
  users,
  teams,
  approveAction,
  rejectAction,
  deactivateAction,
  reactivateAction,
  unlockAction,
  revokeTeamAccessAction,
  restoreTeamAccessAction,
  updateTeamAccessLevelAction,
  inviteTeamMemberAction,
}: {
  users: AdminUserRow[];
  teams: TeamOption[];
  approveAction: (formData: FormData) => Promise<ActionResult>;
  rejectAction: (formData: FormData) => Promise<ActionResult>;
  deactivateAction: (formData: FormData) => Promise<ActionResult>;
  reactivateAction: (formData: FormData) => Promise<ActionResult>;
  unlockAction: (formData: FormData) => Promise<ActionResult>;
  revokeTeamAccessAction: (formData: FormData) => Promise<ActionResult>;
  restoreTeamAccessAction: (formData: FormData) => Promise<ActionResult>;
  updateTeamAccessLevelAction: (formData: FormData) => Promise<ActionResult>;
  inviteTeamMemberAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reviewing, setReviewing] = useState<AdminUserRow | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sort, setSort] = usePersistedValue(
    "optiphoenix.usersSort.v3",
    DIRECTORY_SORT_PLACEHOLDER,
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
    formData: FormData,
    success: string,
    onSuccess?: () => void,
    teamId?: string
  ) {
    if (teamId) setPendingTeamId(teamId);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.error) {
          toast(result.error, { tone: "error" });
          return;
        }
        toast(success, { tone: "success" });
        onSuccess?.();
        router.refresh();
      } catch (error) {
        console.error(error);
        toast("Something went wrong. Try again.", { tone: "error" });
      } finally {
        setPendingTeamId(null);
      }
    });
  }

  function runUserAction(
    action: (formData: FormData) => Promise<ActionResult>,
    userId: string,
    success: string,
    patch?: Partial<AdminUserRow>
  ) {
    const formData = new FormData();
    formData.set("userId", userId);
    run(action, formData, success, () => {
      if (patch && reviewing) {
        setReviewing({ ...reviewing, ...patch });
      } else {
        setReviewing(null);
      }
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Users
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review accounts, manage team access, and invite new members.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="app-btn-primary inline-flex h-10 items-center justify-center gap-2 px-4 text-sm"
          >
            <Mail className="h-4 w-4" />
            Invite member
          </button>
          <label className="w-full min-w-0 sm:w-[11.5rem] sm:shrink-0">
            <span className="sr-only">Sort by</span>
            <Select
              value={sort}
              onChange={(event) => {
                const next = event.target.value;
                if (!next || next === DIRECTORY_SORT_PLACEHOLDER) return;
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
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted">
          No team leads to review yet.
        </p>
      ) : (
        <div className="directory-table-wrap card-enter mt-6">
          <table className="directory-table w-full min-w-[40rem] text-sm">
            <thead>
              <tr>
                <TableHeadLeft className="w-[40%]">User</TableHeadLeft>
                <TableHeadCenter className="w-[18%]">Role</TableHeadCenter>
                <TableHeadCenter className="w-[22%]">Status</TableHeadCenter>
                <TableActionsHeader className="w-[20%]" label="Action" />
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0"
                >
                  <TableCellLeft>
                    <p className="font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </TableCellLeft>
                  <TableCellCenter>
                    {user.role === "ADMIN" ? "Admin" : "Team Lead"}
                  </TableCellCenter>
                  <TableCellCenter>
                    <div className="flex flex-col items-center gap-1">
                      <StatusBadge status={user.status} />
                      {user.lockedUntil ? (
                        <span className="text-[11px] font-medium text-rose-800">
                          Locked
                        </span>
                      ) : null}
                    </div>
                  </TableCellCenter>
                  <TableActionsCell className="w-[20%]">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setReviewing(user);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-hover"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Review
                    </button>
                  </TableActionsCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(reviewing)}
        onClose={() => {
          if (!pending) setReviewing(null);
        }}
        labelledBy="user-review-title"
        className="max-w-xl"
      >
        {reviewing ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="user-review-title"
                className="text-lg font-semibold tracking-tight"
              >
                Review User
              </h2>
              <button
                type="button"
                disabled={pending}
                onClick={() => setReviewing(null)}
                aria-label="Close"
                className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center text-muted transition hover:bg-hover hover:text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <dl className="grid gap-5 text-sm">
              <div className="grid gap-1.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Name
                </dt>
                <dd className="text-base font-medium leading-6">
                  {reviewing.name}
                </dd>
              </div>
              <div className="grid gap-1.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Email
                </dt>
                <dd className="break-all leading-6 text-foreground">
                  {reviewing.email}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="grid gap-1.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Role
                  </dt>
                  <dd className="leading-6">
                    {reviewing.role === "ADMIN" ? "Admin" : "Team Lead"}
                  </dd>
                </div>
                <div className="grid gap-1.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Status
                  </dt>
                  <dd className="pt-0.5">
                    <StatusBadge status={reviewing.status} />
                    {reviewing.lockedUntil ? (
                      <p className="mt-2 text-xs font-medium text-rose-800">
                        Currently locked
                      </p>
                    ) : null}
                  </dd>
                </div>
              </div>
              <div className="grid gap-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Team access
                </dt>
                <dd>
                  <p className="mb-2 text-xs leading-5 text-muted">
                    View = browse only. Write = create clients &amp; forms.
                    Full = manage the team (rename/delete).
                  </p>
                  {reviewing.teams.length === 0 ? (
                    <span className="leading-6 text-muted">No teams yet</span>
                  ) : (
                    <ul className="grid gap-2">
                      {reviewing.teams.map((team) => {
                        const locked = Boolean(team.revokedAt);
                        const isTeamPending = pendingTeamId === team.id;
                        return (
                          <li
                            key={team.id}
                            className="flex items-center gap-2 border border-border bg-surface px-3 py-2"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                              {locked ? (
                                <Tooltip
                                  label="You are not a member of this team"
                                  side="top"
                                >
                                  <span className="inline-flex shrink-0 text-muted">
                                    <Lock className="h-3.5 w-3.5" />
                                  </span>
                                </Tooltip>
                              ) : null}
                              <span
                                className={cn(
                                  "truncate text-sm font-medium",
                                  locked && "text-muted"
                                )}
                              >
                                {team.name}
                              </span>
                            </div>
                            <Select
                              value={team.accessLevel}
                              disabled={isTeamPending || locked}
                              onChange={(event) => {
                                const accessLevel = event.target
                                  .value as AccessLevel;
                                const formData = new FormData();
                                formData.set("userId", reviewing.id);
                                formData.set("teamId", team.id);
                                formData.set("accessLevel", accessLevel);
                                run(
                                  updateTeamAccessLevelAction,
                                  formData,
                                  "Permissions updated",
                                  () => {
                                    setReviewing({
                                      ...reviewing,
                                      teams: reviewing.teams.map((row) =>
                                        row.id === team.id
                                          ? { ...row, accessLevel }
                                          : row
                                      ),
                                    });
                                  },
                                  team.id
                                );
                              }}
                              className="h-8 w-[7.75rem] shrink-0"
                              aria-label={`Access for ${team.name}`}
                            >
                              <option value="VIEW">View</option>
                              <option value="SHARE">Write</option>
                              <option value="FULL">Full</option>
                            </Select>
                            {locked ? (
                              <ActionButton
                                type="button"
                                pending={isTeamPending}
                                disabled={isTeamPending}
                                icon={<LockOpen className="h-3.5 w-3.5" />}
                                onClick={() => {
                                  const formData = new FormData();
                                  formData.set("userId", reviewing.id);
                                  formData.set("teamId", team.id);
                                  run(
                                    restoreTeamAccessAction,
                                    formData,
                                    "Team access restored",
                                    () => {
                                      setReviewing({
                                        ...reviewing,
                                        teams: reviewing.teams.map((row) =>
                                          row.id === team.id
                                            ? { ...row, revokedAt: null }
                                            : row
                                        ),
                                      });
                                    },
                                    team.id
                                  );
                                }}
                                className="h-8 shrink-0 border border-border bg-surface px-2 text-xs font-medium"
                              >
                                Restore
                              </ActionButton>
                            ) : (
                              <ActionButton
                                type="button"
                                pending={isTeamPending}
                                disabled={isTeamPending}
                                icon={<ShieldOff className="h-3.5 w-3.5" />}
                                onClick={() => {
                                  const formData = new FormData();
                                  formData.set("userId", reviewing.id);
                                  formData.set("teamId", team.id);
                                  run(
                                    revokeTeamAccessAction,
                                    formData,
                                    "Team access revoked",
                                    () => {
                                      setReviewing({
                                        ...reviewing,
                                        teams: reviewing.teams.map((row) =>
                                          row.id === team.id
                                            ? {
                                                ...row,
                                                revokedAt:
                                                  new Date().toISOString(),
                                              }
                                            : row
                                        ),
                                      });
                                    },
                                    team.id
                                  );
                                }}
                                className="h-8 shrink-0 border border-rose-200 bg-rose-50 px-2 text-xs font-medium text-rose-800"
                              >
                                Revoke
                              </ActionButton>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
              {reviewing.lockedUntil ? (
                <ActionButton
                  type="button"
                  pending={pending}
                  disabled={pending}
                  icon={<LockOpen className="h-4 w-4" />}
                  onClick={() =>
                    runUserAction(
                      unlockAction,
                      reviewing.id,
                      "Account unlocked",
                      { lockedUntil: null }
                    )
                  }
                  className="app-btn-secondary px-4 py-2.5 text-sm"
                >
                  Unlock
                </ActionButton>
              ) : null}
              {reviewing.status === "PENDING" ? (
                <>
                  <ActionButton
                    type="button"
                    pending={pending}
                    disabled={pending}
                    icon={<XCircle className="h-4 w-4" />}
                    onClick={() =>
                      runUserAction(
                        rejectAction,
                        reviewing.id,
                        "Account rejected — they cannot sign in.",
                        { status: "REJECTED" }
                      )
                    }
                    className="border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-800 transition hover:bg-rose-100"
                  >
                    Reject
                  </ActionButton>
                  <ActionButton
                    type="button"
                    pending={pending}
                    disabled={pending}
                    icon={<Check className="h-4 w-4" />}
                    onClick={() =>
                      runUserAction(
                        approveAction,
                        reviewing.id,
                        "Account approved. They can sign in now.",
                        { status: "APPROVED" }
                      )
                    }
                    className="app-btn-primary px-4 py-2.5 text-sm"
                  >
                    Approve
                  </ActionButton>
                </>
              ) : null}
              {reviewing.status === "APPROVED" ? (
                <ActionButton
                  type="button"
                  pending={pending}
                  disabled={pending}
                  icon={<UserX className="h-4 w-4" />}
                  onClick={() =>
                    runUserAction(
                      deactivateAction,
                      reviewing.id,
                      "Account deactivated. They cannot sign in — contact admin message on login.",
                      { status: "DEACTIVATED" }
                    )
                  }
                  className="border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-800 transition hover:bg-rose-100"
                >
                  Deactivate user
                </ActionButton>
              ) : null}
              {reviewing.status === "DEACTIVATED" ||
              reviewing.status === "REJECTED" ? (
                <ActionButton
                  type="button"
                  pending={pending}
                  disabled={pending}
                  icon={<UserCheck className="h-4 w-4" />}
                  onClick={() =>
                    runUserAction(
                      reviewing.status === "DEACTIVATED"
                        ? reactivateAction
                        : approveAction,
                      reviewing.id,
                      "Account activated. They can sign in now.",
                      { status: "APPROVED" }
                    )
                  }
                  className="app-btn-primary px-4 py-2.5 text-sm"
                >
                  {reviewing.status === "DEACTIVATED"
                    ? "Reactivate"
                    : "Approve"}
                </ActionButton>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => {
          if (!pending) setInviteOpen(false);
        }}
        labelledBy="invite-member-title"
        className="max-w-lg"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="invite-member-title"
                className="text-lg font-semibold tracking-tight"
              >
                Invite member
              </h2>
              <p className="mt-1 text-sm text-muted">
                Send an email invite with role and access. They create a
                password and join the team.
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => setInviteOpen(false)}
              aria-label="Close"
              className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center text-muted transition hover:bg-hover hover:text-foreground"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              run(
                inviteTeamMemberAction,
                formData,
                "Invite sent. They’ll receive an email to join.",
                () => {
                  setInviteOpen(false);
                }
              );
            }}
          >
            <label className="grid gap-1.5 text-sm font-medium">
              Email
              <input
                name="email"
                type="email"
                required
                placeholder="colleague@company.com"
                className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Team
              <Select name="teamId" required defaultValue="" className="w-full">
                <option value="" disabled>
                  Choose a team
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Role
                <Select name="role" defaultValue="TEAM_LEAD" className="w-full">
                  <option value="TEAM_LEAD">Team Lead</option>
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Access
                <Select
                  name="accessLevel"
                  defaultValue="FULL"
                  className="w-full"
                >
                  <option value="VIEW">View</option>
                  <option value="SHARE">Write</option>
                  <option value="FULL">Full access</option>
                </Select>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={() => setInviteOpen(false)}
                className="app-btn-secondary px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <ActionButton
                type="submit"
                pending={pending}
                disabled={pending || teams.length === 0}
                icon={<Mail className="h-4 w-4" />}
                className="app-btn-primary px-4 py-2.5 text-sm"
              >
                Send invite
              </ActionButton>
            </div>
          </form>
        </div>
      </Modal>
    </section>
  );
}
