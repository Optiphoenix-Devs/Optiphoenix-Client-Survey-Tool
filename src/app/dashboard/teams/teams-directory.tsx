"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Plus, Trash2, Users } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
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
import { runServerAction } from "@/lib/run-server-action";
import {
  DIRECTORY_SORT_SELECTION_VALUES,
  sortDirectoryRows,
  type DirectorySort,
} from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { columnLabel } from "@/lib/format";
import { matchesDirectorySearch } from "@/lib/directory-search";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { CountCardLine } from "@/components/directory/directory-card-meta";
import {
  DirectoryCard,
  DirectoryCardButton,
  DirectoryCardFooter,
  DirectoryCardIcon,
  DirectoryCardTitle,
} from "@/components/directory/directory-card";
import { TableHeadCenter, TableHeadLeft, TableCellCenter, TableCellLeft, DirectoryTableRow } from "@/components/directory/directory-table";
import { Stagger } from "@/components/ui/skeleton";

type TeamDirectoryRow = {
  id: string;
  name: string;
  memberCount: number;
  clientCount: number;
  formCount: number;
  href: string;
  updatedAt: string;
};

type TeamsDirectoryProps = {
  teams: TeamDirectoryRow[];
  createAction: (formData: FormData) => Promise<ActionResult>;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
};

const VIEW_KEY = "optiphoenix.teamsView";
const SORT_KEY = "optiphoenix.teamsSort.v2";

export function TeamsDirectory({
  teams,
  createAction,
  updateAction,
  deleteAction,
}: TeamsDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "", DIRECTORY_SORT_SELECTION_VALUES);
  const [drawer, setDrawer] = useState<"create" | TeamDirectoryRow | null>(null);
  const [deleting, setDeleting] = useState<TeamDirectoryRow | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const filtered = query.trim()
      ? teams.filter((team) => matchesDirectorySearch(query, [team.name]))
      : teams;
    return sortDirectoryRows(
      filtered,
      sort,
      (team) => team.updatedAt,
      (team) => team.name
    );
  }, [query, teams, sort]);
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
  const memberTotal = visible.reduce((sum, team) => sum + team.memberCount, 0);
  const clientTotal = visible.reduce((sum, team) => sum + team.clientCount, 0);
  const formTotal = visible.reduce((sum, team) => sum + team.formCount, 0);

  return (
    <section>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Teams</h1>
        <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
          <DirectoryToolbar
            query={query}
            onQueryChange={setQuery}
            view={view}
            onViewChange={setView}
            searchPlaceholder="Search teams..."
            className="w-full lg:flex-1"
            sort={sort}
            onSortChange={(next: DirectorySort) => {
              setSort(next);
              paged.setPage(1);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setDrawer("create");
            }}
            className="app-btn-primary w-full justify-center px-4 py-2.5 text-sm lg:w-auto lg:shrink-0"
          >
            <Plus className="h-4 w-4" />
            New team
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {teams.length === 0
            ? "No teams yet. Create the first one."
            : "No teams match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((team, index) => (
            <li key={team.id} className="h-full">
              <Stagger index={index}>
              <DirectoryCard>
                <DirectoryCardIcon>
                  <Users className="h-5 w-5" />
                </DirectoryCardIcon>
                <div className="mt-4 min-w-0 flex-1">
                  <DirectoryCardTitle title={team.name}>{team.name}</DirectoryCardTitle>
                  <dl className="mt-5 space-y-2">
                    <CountCardLine count={team.clientCount} singular="Client" />
                    <CountCardLine count={team.formCount} singular="Form" />
                  </dl>
                </div>
                <DirectoryCardFooter>
                  <DirectoryCardButton href={team.href} variant="primary">
                    <Building2 className="h-3.5 w-3.5" />
                    Clients
                  </DirectoryCardButton>
                  <DirectoryCardButton
                    variant="secondary"
                    onClick={() => {
                      setDrawer(team);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </DirectoryCardButton>
                  <DirectoryCardButton
                    variant="danger"
                    onClick={() => {
                      setDeleting(team);
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
          <table className="directory-table w-full min-w-[44rem] text-sm">
            <thead>
              <tr>
                <TableHeadLeft className="w-[32%]">
                  {columnLabel(visible.length, "Team", "Teams")}
                </TableHeadLeft>
                <TableHeadCenter className="w-[14%]">
                  {columnLabel(memberTotal, "Member", "Members")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[14%]">
                  {columnLabel(clientTotal, "Client", "Clients")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[14%]">
                  {columnLabel(formTotal, "Form", "Forms")}
                </TableHeadCenter>
                <TableActionsHeader className="w-[26%]" />
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((team) => (
                <DirectoryTableRow key={team.id} href={team.href} ariaLabel={`Open ${team.name}`}>
                  <TableCellLeft className="font-medium">{team.name}</TableCellLeft>
                  <TableCellCenter className="tabular-nums">{team.memberCount}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">{team.clientCount}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">{team.formCount}</TableCellCenter>
                  <TableActionsCell>
                    <TableEditButton
                      label={team.name}
                      onClick={() => {
                        setDrawer(team);
                      }}
                    />
                    <TableDeleteButton
                      label={team.name}
                      onClick={() => {
                        setDeleting(team);
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
        title={editing ? "Edit team" : "New team"}
        description={
          editing
            ? "Rename this team. The name must be unique."
            : "You become a member automatically. The name must be unique."
        }
        onClose={closeDrawer}
      >
        <form
          key={editing?.id ?? "create-team"}
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(
              editing ? updateAction : createAction,
              formData,
              editing ? "Team saved" : "Team created",
              closeDrawer
            );
          }}
        >
          {editing ? <input type="hidden" name="teamId" value={editing.id} /> : null}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Team name
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={editing?.name ?? ""}
              autoFocus
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
              {editing ? "Save" : "Create team"}
            </button>
          </DrawerActions>
        </form>
      </SideDrawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleting ? `Delete “${deleting.name}”?` : "Delete team"}
        description="This also removes its clients, forms, and related data (if any). Are you sure?"
        pending={pending}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (!deleting) return;
          const formData = new FormData();
          formData.set("teamId", deleting.id);
          run(deleteAction, formData, "Team deleted", () => {
            setDeleting(null);
          });
        }}
      />
    </section>
  );
}
