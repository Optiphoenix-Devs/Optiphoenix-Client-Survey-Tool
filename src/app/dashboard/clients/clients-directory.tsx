"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { ClientDirectoryRow } from "@/lib/clients";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/pending-button";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Stagger } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { pluralize } from "@/lib/format";
import { sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { usePersistedValue } from "@/lib/use-persisted-value";

type TeamOption = { id: string; name: string };

type ClientsDirectoryProps = {
  clients: ClientDirectoryRow[];
  teams: TeamOption[];
  lockedTeamId?: string;
  title?: string;
  createAction: (formData: FormData) => Promise<ActionResult>;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
};

const VIEW_KEY = "optiphoenix.clientsView";
const SORT_KEY = "optiphoenix.clientsSort";

export function ClientsDirectory({
  clients,
  teams,
  lockedTeamId,
  title = "Clients",
  createAction,
  updateAction,
  deleteAction,
}: ClientsDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = usePersistedValue(VIEW_KEY, "grid", ["grid", "table"]);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);
  const [drawer, setDrawer] = useState<"create" | ClientDirectoryRow | null>(null);
  const [deleting, setDeleting] = useState<ClientDirectoryRow | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? clients.filter((client) =>
          [client.name, client.company ?? "", client.email ?? "", client.teamName]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        )
      : clients;
    return sortDirectoryRows(
      filtered,
      sort,
      (client) => client.updatedAt,
      (client) => client.name
    );
  }, [clients, query, sort]);
  const paged = usePaged(visible);

  function closeDrawer() {
    setDrawer(null);
  }

  function run(
    action: (formData: FormData) => Promise<ActionResult>,
    formData: FormData,
    success: string,
    onSuccess: () => void
  ) {
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      toast(success, { tone: "success" });
      onSuccess();
      router.refresh();
    });
  }

  const editing = drawer && drawer !== "create" ? drawer : null;
  const canCreate = teams.length > 0;

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <DirectoryToolbar
          query={query}
          onQueryChange={setQuery}
          view={view}
          onViewChange={setView}
          searchPlaceholder="Search clients..."
          className="flex-1"
          sort={sort}
          onSortChange={(next: DirectorySort) => {
            setSort(next);
            paged.setPage(1);
          }}
        />
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => {
            setDrawer("create");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New client
        </button>
      </div>

      {!canCreate ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          Create a team first, then add clients to it.{" "}
          <Link href="/dashboard/teams" className="font-medium text-accent hover:text-accent-hover">
            Go to Teams
          </Link>
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {clients.length === 0
            ? "No clients yet. Add the first one."
            : "No clients match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((client, index) => (
            <li key={client.id} className="h-full">
              <Stagger index={index}>
              <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-5">
                <span className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-sage/15" />
                <p className="line-clamp-2 min-h-[3.25rem] text-lg font-semibold tracking-tight">{client.name}</p>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
                  {client.company || "No company"} · {client.email || "No email"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {client.teamName} · {pluralize(client.formCount, "form")}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link
                    href={client.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawer(client);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-background"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleting(client);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[44rem] table-fixed text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="w-[18%] px-4 py-3 text-left font-medium">Client</th>
                <th className="w-[16%] px-4 py-3 text-left font-medium">Company</th>
                <th className="w-[22%] px-4 py-3 text-left font-medium">Email</th>
                <th className="w-[16%] px-4 py-3 text-left font-medium">Team</th>
                <th className="w-[10%] px-4 py-3 text-center font-medium">Forms</th>
                <th className="w-[18%] px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link href={client.href} className="hover:text-accent">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{client.company || "—"}</td>
                  <td className="px-4 py-3 text-muted">{client.email || "—"}</td>
                  <td className="px-4 py-3 text-muted">{client.teamName}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{client.formCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawer(client);
                        }}
                        className="text-sm font-medium text-accent hover:text-accent-hover"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(client);
                        }}
                        className="text-sm font-medium text-rose-800 hover:text-rose-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > 0 ? (
        <Pagination
          page={paged.page}
          pageCount={paged.pageCount}
          onPageChange={paged.setPage}
        />
      ) : null}

      <SideDrawer
        open={drawer !== null}
        title={editing ? "Edit client" : "New client"}
        description="Names must be unique across the teams you can access."
        onClose={closeDrawer}
      >
        <form
          key={editing?.id ?? "create-client"}
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(
              editing ? updateAction : createAction,
              formData,
              editing ? "Client saved" : "Client created",
              closeDrawer
            );
          }}
        >
          {editing ? (
            <>
              <input type="hidden" name="clientId" value={editing.id} />
              <input type="hidden" name="teamId" value={editing.teamId} />
            </>
          ) : lockedTeamId ? (
            <input type="hidden" name="teamId" value={lockedTeamId} />
          ) : (
            <label className="mb-4 flex flex-col gap-1.5 text-sm font-medium">
              Team
              <Select
                name="teamId"
                required
                defaultValue={teams[0]?.id}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Client name
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              defaultValue={editing?.name ?? ""}
              autoFocus
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={editing?.email ?? ""}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Company (optional)
            <input
              name="company"
              maxLength={120}
              defaultValue={editing?.company ?? ""}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <DrawerActions>
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Spinner />
                  {editing ? "Saving…" : "Create client"}
                </>
              ) : editing ? (
                "Save"
              ) : (
                "Create client"
              )}
            </button>
          </DrawerActions>
        </form>
      </SideDrawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Are you absolutely sure?"
        description={
          deleting
            ? `This will permanently delete client “${deleting.name}”. Their forms and survey links for this team will be removed. This cannot be undone.`
            : "This will permanently delete this client."
        }
        confirmLabel="Delete client"
        pending={pending}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (!deleting) return;
          const formData = new FormData();
          formData.set("teamId", deleting.teamId);
          formData.set("clientId", deleting.id);
          run(deleteAction, formData, "Client deleted", () => {
            setDeleting(null);
          });
        }}
      />
    </section>
  );
}
