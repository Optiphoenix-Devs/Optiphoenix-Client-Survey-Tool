"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, FileText, Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
import { matchesDirectorySearch } from "@/lib/directory-search";
import { runServerAction } from "@/lib/run-server-action";
import {
  DIRECTORY_SORT_PLACEHOLDER,
  DIRECTORY_SORT_SELECTION_VALUES,
  sortDirectoryRows,
  type DirectorySort,
} from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

type TeamOption = { id: string; name: string };

type ClientsDirectoryProps = {
  clients: ClientDirectoryRow[];
  /** Teams the user can create clients in (Write/Full only). */
  teams: TeamOption[];
  lockedTeamId?: string;
  title?: string;
  /** When false, hide create/edit/delete (View access). Defaults from teams.length. */
  canCreate?: boolean;
  createAction: (formData: FormData) => Promise<ActionResult>;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
};

const VIEW_KEY = "optiphoenix.clientsView";
const SORT_KEY = "optiphoenix.clientsSort.v3";

export function ClientsDirectory({
  clients,
  teams,
  lockedTeamId,
  title = "Clients",
  canCreate: canCreateProp,
  createAction,
  updateAction,
  deleteAction,
}: ClientsDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(
    SORT_KEY,
    DIRECTORY_SORT_PLACEHOLDER,
    DIRECTORY_SORT_SELECTION_VALUES
  );
  const [drawer, setDrawer] = useState<"create" | ClientDirectoryRow | null>(null);
  const [deleting, setDeleting] = useState<ClientDirectoryRow | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const filtered = query.trim()
      ? clients.filter((client) =>
          matchesDirectorySearch(query, [
            client.name,
            client.email,
            client.teamName,
          ])
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
  const canCreate = canCreateProp ?? teams.length > 0;
  const formTotal = visible.reduce((sum, client) => sum + client.formCount, 0);

  return (
    <section>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
          <DirectoryToolbar
            query={query}
            onQueryChange={setQuery}
            view={view}
            onViewChange={setView}
            searchPlaceholder="Search clients..."
            className="w-full lg:flex-1"
            sort={sort}
            onSortChange={(next: DirectorySort) => {
              setSort(next);
              paged.setPage(1);
            }}
          />
          {canCreate ? (
            <button
              type="button"
              onClick={() => {
                setDrawer("create");
              }}
              className="app-btn-primary w-full justify-center px-4 py-2.5 text-sm lg:w-auto lg:shrink-0"
            >
              <Plus className="h-4 w-4" />
              New client
            </button>
          ) : null}
        </div>
      </div>

      {clients.length === 0 && !canCreate ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {lockedTeamId
            ? "You have view-only access to this team. Ask an admin for Write or Full access to add clients."
            : (
              <>
                Create a team first, then add clients to it.{" "}
                <Link href="/dashboard/teams" className="font-medium text-accent hover:text-accent-hover">
                  Go to Teams
                </Link>
              </>
            )}
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {clients.length === 0
            ? canCreate
              ? "No clients yet. Add the first one."
              : "No clients yet."
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
                      label="Email"
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
                  {client.canManage ? (
                    <>
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
                        Remove
                      </DirectoryCardButton>
                    </>
                  ) : null}
                </DirectoryCardFooter>
              </DirectoryCard>
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="directory-table-wrap mt-6">
          <table className="directory-table w-full min-w-[48rem] text-sm">
            <thead>
              <tr>
                <TableHeadLeft className="w-[20%]">
                  {columnLabel(visible.length, "Team", "Teams")}
                </TableHeadLeft>
                <TableHeadLeft className="w-[24%]">
                  {columnLabel(visible.length, "Client", "Clients")}
                </TableHeadLeft>
                <TableHeadCenter className="w-[28%]">
                  {columnLabel(visible.length, "Email", "Emails")}
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
                  <TableCellLeft className="text-muted">{client.teamName}</TableCellLeft>
                  <TableCellLeft className="font-medium">{client.name}</TableCellLeft>
                  <TableCellCenter className="text-muted">{client.email || "—"}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">{client.formCount}</TableCellCenter>
                  <TableActionsCell>
                    {client.canManage ? (
                      <>
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
                      </>
                    ) : null}
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
          <DrawerActions>
            <button
              type="button"
              onClick={closeDrawer}
              className="app-btn-secondary px-4 py-2 text-sm"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="app-btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {pending ? (
                <Spinner />
              ) : editing ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editing ? "Save" : "Create client"}
            </button>
          </DrawerActions>
        </form>
      </SideDrawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleting ? `Remove “${deleting.name}”?` : "Remove client"}
        description="This action will remove all the data associated with it too, Are you sure?"
        pending={pending}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (!deleting) return;
          const formData = new FormData();
          formData.set("teamId", deleting.teamId);
          formData.set("clientId", deleting.id);
          run(deleteAction, formData, "Client removed", () => {
            setDeleting(null);
          });
        }}
      />
    </section>
  );
}
