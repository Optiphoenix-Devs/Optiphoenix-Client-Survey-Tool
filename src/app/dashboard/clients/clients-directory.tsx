"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { ClientDirectoryRow } from "@/lib/clients";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/pending-button";
import {
  TableActionsCell,
  TableActionsHeader,
  TableDeleteButton,
  TableEditButton,
} from "@/components/ui/table-actions";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import {
  CountCardLine,
  DirectoryCardLine,
} from "@/components/directory/directory-card-meta";
import {
  DirectoryCard,
  DirectoryCardButton,
  DirectoryCardFooter,
  DirectoryCardIcon,
  DirectoryCardTitle,
} from "@/components/directory/directory-card";
import { TableHeadCenter, TableHeadLeft, TableCellCenter, TableCellLeft, DirectoryTableRow } from "@/components/directory/directory-table";
import { Stagger } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { columnLabel } from "@/lib/format";
import { runServerAction } from "@/lib/run-server-action";
import { sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
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
  const [view, setView] = useDirectoryView(VIEW_KEY);
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
      await runServerAction({
        action,
        formData,
        successMessage: success,
        onSuccess: () => onSuccess(),
        refresh: () => router.refresh(),
      });
    });
  }

  const editing = drawer && drawer !== "create" ? drawer : null;
  const canCreate = teams.length > 0;
  const formTotal = visible.reduce((sum, client) => sum + client.formCount, 0);

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
          className="app-btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New client
        </button>
      </div>

      {!canCreate ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          Create a team first, then add clients to it.{" "}
          <Link href="/dashboard/teams" className="font-medium text-accent hover:text-accent-hover">
            Go to Teams
          </Link>
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {clients.length === 0
            ? "No clients yet. Add the first one."
            : "No clients match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((client, index) => (
            <li key={client.id} className="h-full">
              <Stagger index={index}>
              <DirectoryCard>
                <DirectoryCardIcon>
                  <Building2 className="h-5 w-5" />
                </DirectoryCardIcon>
                <div className="mt-4 min-w-0 flex-1">
                  <DirectoryCardTitle title={client.name}>{client.name}</DirectoryCardTitle>
                  <dl className="mt-5 space-y-2">
                    <DirectoryCardLine label="Team" value={client.teamName} title={client.teamName} />
                    <DirectoryCardLine
                      label="Organization Name"
                      value={client.company || "—"}
                      title={client.company || undefined}
                    />
                    <DirectoryCardLine
                      label="Organization Email"
                      value={client.email || "—"}
                      title={client.email || undefined}
                    />
                    <CountCardLine count={client.formCount} singular="Form" />
                  </dl>
                </div>
                <DirectoryCardFooter>
                  <DirectoryCardButton href={client.href} variant="primary">
                    <FileText className="h-3.5 w-3.5" />
                    Forms
                  </DirectoryCardButton>
                  <DirectoryCardButton
                    variant="secondary"
                    onClick={() => {
                      setDrawer(client);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </DirectoryCardButton>
                  <DirectoryCardButton
                    variant="danger"
                    onClick={() => {
                      setDeleting(client);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DirectoryCardButton>
                </DirectoryCardFooter>
              </DirectoryCard>
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="directory-table-wrap mt-6">
          <table className="directory-table w-full min-w-[44rem] table-fixed text-sm">
            <thead>
              <tr>
                <TableHeadLeft className="w-[18%]">
                  {columnLabel(visible.length, "Client", "Clients")}
                </TableHeadLeft>
                <TableHeadCenter className="w-[16%]">
                  {columnLabel(visible.length, "Organization", "Organizations")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[22%]">
                  {columnLabel(visible.length, "Email", "Emails")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[16%]">
                  {columnLabel(visible.length, "Team", "Teams")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[10%]">
                  {columnLabel(formTotal, "Form", "Forms")}
                </TableHeadCenter>
                <TableActionsHeader className="w-[18%]" />
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((client) => (
                <DirectoryTableRow
                  key={client.id}
                  href={client.href}
                  ariaLabel={`Open ${client.name}`}
                >
                  <TableCellLeft className="font-medium">{client.name}</TableCellLeft>
                  <TableCellCenter className="text-muted">{client.company || "—"}</TableCellCenter>
                  <TableCellCenter className="text-muted">{client.email || "—"}</TableCellCenter>
                  <TableCellCenter className="text-muted">{client.teamName}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">{client.formCount}</TableCellCenter>
                  <TableActionsCell>
                    <TableEditButton
                      label={client.name}
                      onClick={() => {
                        setDrawer(client);
                      }}
                    />
                    <TableDeleteButton
                      label={client.name}
                      onClick={() => {
                        setDeleting(client);
                      }}
                    />
                  </TableActionsCell>
                </DirectoryTableRow>
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
          total={paged.total}
          rangeStart={paged.rangeStart}
          rangeEnd={paged.rangeEnd}
          pageSize={paged.pageSize}
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
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={editing?.email ?? ""}
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Organization (optional)
            <input
              name="company"
              maxLength={120}
              defaultValue={editing?.company ?? ""}
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <DrawerActions>
            <button
              type="button"
              onClick={closeDrawer}
              className="app-btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="app-btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {pending ? <Spinner /> : null}
              {editing ? "Save" : "Create client"}
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
