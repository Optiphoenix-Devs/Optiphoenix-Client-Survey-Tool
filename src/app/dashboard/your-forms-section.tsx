"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, LayoutGrid, Plus, Search, Table2, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { DashboardFormRow } from "@/lib/teams";
import { cn } from "@/lib/cn";
import { formatMonthYear, columnLabel } from "@/lib/format";
import {
  DirectoryCardLine,
} from "@/components/directory/directory-card-meta";
import { DirectoryCard, DirectoryCardIcon, DirectoryCardTitle } from "@/components/directory/directory-card";
import { TableHeadCenter, TableHeadLeft, TableCellCenter, TableCellLeft, DirectoryTableRow } from "@/components/directory/directory-table";
import { runServerAction } from "@/lib/run-server-action";
import { DIRECTORY_SORT_OPTIONS, sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableActionsCell, TableActionsHeader, TableDeleteButton } from "@/components/ui/table-actions";
import { ActionButton } from "@/components/ui/pending-button";
import { Stagger } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

type FormsFilter = "all" | "published" | "drafts";

type TemplateOption = {
  id: string;
  name: string;
  fieldCount: number;
};

const VIEW_STORAGE_KEY = "optiphoenix.formsView";
const SORT_KEY = "optiphoenix.formsSort";

const FILTERS: Array<{ id: FormsFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
];

function parseFilter(value: string | null): FormsFilter {
  if (value === "published" || value === "drafts") return value;
  return "all";
}

export function YourFormsSection({
  forms,
  title = "Your forms",
  templates = [],
  createAction,
  deleteAction,
}: {
  forms: DashboardFormRow[];
  title?: string;
  templates?: TemplateOption[];
  createAction?: (formData: FormData) => Promise<ActionResult>;
  deleteAction?: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("forms"));
  const [view, setView] = useDirectoryView(VIEW_STORAGE_KEY);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<DashboardFormRow | null>(null);
  const [pending, startTransition] = useTransition();
  const canCreate = Boolean(createAction);
  const canDelete = Boolean(deleteAction);

  function setFilter(next: FormsFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("forms");
    } else {
      params.set("forms", next);
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}#forms` : `${pathname}#forms`, {
      scroll: false,
    });
  }

  const visible = useMemo(
    () =>
      sortDirectoryRows(
        filterForms(forms, filter, query),
        sort,
        (form) => form.updatedAt,
        (form) => form.title
      ),
    [forms, filter, query, sort]
  );
  const paged = usePaged(visible);
  const fieldTotal = visible.reduce((sum, form) => sum + form.fieldCount, 0);
  const responseTotal = visible.reduce((sum, form) => sum + form.responseCount, 0);

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createAction) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await runServerAction({
        action: createAction,
        formData,
        successMessage: "Form created.",
        onSuccess: (result) => {
          closeDrawer();
          if (result.formId) router.push(`/dashboard/forms/${result.formId}`);
        },
        refresh: () => router.refresh(),
      });
    });
  }

  function confirmDelete() {
    if (!deleting || !deleteAction) return;
    const formData = new FormData();
    formData.set("formId", deleting.id);
    startTransition(async () => {
      await runServerAction({
        action: deleteAction,
        formData,
        successMessage: "Draft form deleted.",
        onSuccess: () => setDeleting(null),
        refresh: () => router.refresh(),
      });
    });
  }

  return (
    <section id="forms" className="scroll-mt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <h2
          className={
            title === "Your forms"
              ? "text-lg font-semibold tracking-tight"
              : "text-3xl font-semibold tracking-tight"
          }
        >
          {title}
        </h2>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <div className="flex app-radius border border-border bg-surface p-1">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "app-radius px-3 py-1.5 text-sm font-medium transition",
                  filter === item.id
                    ? "app-brand-surface"
                    : "text-muted app-brand-hover"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <span className="sr-only">Search forms</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search forms..."
              className="app-toolbar-input outline-none"
            />
          </label>
          <label className="w-[11.5rem] shrink-0">
            <span className="sr-only">Sort by</span>
            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as DirectorySort);
                paged.setPage(1);
              }}
              aria-label="Sort by"
              className="app-radius py-2"
            >
              {DIRECTORY_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <div
            className="flex h-10 app-radius border border-border bg-surface p-1"
            role="group"
            aria-label="Forms layout"
          >
            <Tooltip label="Card grid" side="bottom">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                className={cn(
                  "grid h-full w-9 place-items-center app-radius transition",
                  view === "grid" ? "app-icon-toggle-active" : "app-icon-toggle text-muted"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Card grid</span>
              </button>
            </Tooltip>
            <Tooltip label="Table" side="bottom">
              <button
                type="button"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
                className={cn(
                  "grid h-full w-9 place-items-center app-radius transition",
                  view === "table" ? "app-icon-toggle-active" : "app-icon-toggle text-muted"
                )}
              >
                <Table2 className="h-4 w-4" />
                <span className="sr-only">Table</span>
              </button>
            </Tooltip>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="app-btn-primary px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              New form
            </button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {forms.length === 0 ? (
            canCreate ? (
              "No forms yet. Create a blank form or start from a template."
            ) : (
              "No forms yet."
            )
          ) : (
            "No forms match this filter."
          )}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((form, index) => (
            <li key={form.id} className="min-h-0">
              <Stagger index={index}>
                <FormCard
                  form={form}
                  canDelete={canDelete && form.status === "DRAFT"}
                  onDelete={() => setDeleting(form)}
                />
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="directory-table-wrap card-enter mt-6">
          <table className="directory-table w-full min-w-[44rem] table-fixed text-sm">
            <thead>
              <tr>
                <TableHeadLeft className="w-[30%]">
                  {columnLabel(visible.length, "Form", "Forms")}
                </TableHeadLeft>
                <TableHeadCenter className="w-[18%]">
                  {columnLabel(visible.length, "Client", "Clients")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[12%]">Status</TableHeadCenter>
                <TableHeadCenter className="w-[16%]">
                  {columnLabel(visible.length, "Team", "Teams")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[8%]">
                  {columnLabel(fieldTotal, "Field", "Fields")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[8%]">
                  {columnLabel(responseTotal, "Response", "Responses")}
                </TableHeadCenter>
                {canDelete ? <TableActionsHeader className="w-[8%]" /> : null}
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((form) => (
                <DirectoryTableRow
                  key={form.id}
                  href={form.href}
                  ariaLabel={`Open ${form.title}`}
                >
                  <TableCellLeft>
                    <span className="block truncate font-medium">{form.title}</span>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {formatMonthYear(form.updatedAt)}
                    </p>
                  </TableCellLeft>
                  <TableCellCenter className="text-muted">{form.clientName}</TableCellCenter>
                  <TableCellCenter>
                    <StatusBadge status={form.status} />
                  </TableCellCenter>
                  <TableCellCenter className="truncate text-muted">{form.teamName}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">{form.fieldCount}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">
                    <Link
                      href={`/dashboard/responses?form=${form.id}`}
                      className="hover:text-accent"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {form.responseCount}
                    </Link>
                  </TableCellCenter>
                  {canDelete ? (
                    <TableActionsCell className="w-[8%]">
                      {form.status === "DRAFT" ? (
                        <TableDeleteButton
                          label={form.title}
                          onClick={() => setDeleting(form)}
                        />
                      ) : null}
                    </TableActionsCell>
                  ) : null}
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

      {canCreate ? (
        <SideDrawer
          open={drawerOpen}
          title="New form"
          description="Start blank or pick a template. Publish only after you integrate a client on the builder."
          onClose={closeDrawer}
        >
          <form onSubmit={submitCreate}>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Form title
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                autoFocus
                placeholder="April client feedback"
                className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
              Start from
              <Select
                name="templateId"
                defaultValue=""
              >
                <option value="">Blank form</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.fieldCount} fields
                  </option>
                ))}
              </Select>
            </label>
            {templates.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                After you build a form, save it as a template to reuse next month.
              </p>
            ) : null}
            <DrawerActions>
              <button
                type="button"
                onClick={closeDrawer}
                className="app-btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <ActionButton
                pending={pending}
                className="app-btn-primary px-4 py-2 text-sm"
              >
                Create form
              </ActionButton>
            </DrawerActions>
          </form>
        </SideDrawer>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete draft form?"
        description={
          deleting
            ? `“${deleting.title}” will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete draft"
        pending={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

function filterForms(forms: DashboardFormRow[], filter: FormsFilter, query: string) {
  const needle = query.trim().toLowerCase();
  return forms.filter((form) => {
    const statusOk =
      filter === "all" ||
      (filter === "published" && form.status === "PUBLISHED") ||
      (filter === "drafts" && form.status === "DRAFT");
    if (!statusOk) return false;
    if (!needle) return true;
    return (
      form.title.toLowerCase().includes(needle) ||
      form.clientName.toLowerCase().includes(needle) ||
      form.teamName.toLowerCase().includes(needle)
    );
  });
}

function FormCard({
  form,
  canDelete,
  onDelete,
}: {
  form: DashboardFormRow;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <DirectoryCard>
      <div className="flex items-start justify-between gap-3">
        <DirectoryCardIcon>
          <FileText className="h-5 w-5" />
        </DirectoryCardIcon>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={form.status} />
          <span className="text-xs whitespace-nowrap text-muted">
            {formatMonthYear(form.updatedAt)}
          </span>
          {canDelete ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete?.();
              }}
              className="inline-flex h-8 w-8 items-center justify-center text-muted hover:bg-hover hover:text-rose-600"
              aria-label={`Delete draft ${form.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <Link href={form.href} className="mt-4 block min-w-0 flex-1">
        <DirectoryCardTitle title={form.title}>{form.title}</DirectoryCardTitle>
        <div className="mt-5 space-y-2">
          <DirectoryCardLine label="Client" value={form.clientName} title={form.clientName} />
          <DirectoryCardLine label="Team" value={form.teamName} title={form.teamName} />
        </div>
      </Link>
    </DirectoryCard>
  );
}

function StatusBadge({ status }: { status: DashboardFormRow["status"] }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={cn(
        "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
