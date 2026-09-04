"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { TemplateListRow } from "@/lib/templates";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Stagger } from "@/components/ui/skeleton";
import { ActionButton } from "@/components/ui/pending-button";
import {
  TableActionsCell,
  TableActionsHeader,
  TableDeleteButton,
  TableEditLink,
  TableUseButton,
} from "@/components/ui/table-actions";
import { formatMonthYear, columnLabel, pluralize } from "@/lib/format";
import { matchesDirectorySearch } from "@/lib/directory-search";
import { TableHeadCenter, TableHeadLeft, TableCellCenter, TableCellLeft, DirectoryTableRow } from "@/components/directory/directory-table";
import {
  DirectoryCard,
  DirectoryCardButton,
  DirectoryCardFooter,
  DirectoryCardIcon,
  DirectoryCardTitle,
} from "@/components/directory/directory-card";
import { runServerAction } from "@/lib/run-server-action";
import {
  DIRECTORY_SORT_SELECTION_VALUES,
  sortDirectoryRows,
  type DirectorySort,
} from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

const VIEW_KEY = "optiphoenix.templatesView";
const SORT_KEY = "optiphoenix.templatesSort.v2";

export function TemplatesDirectory({
  templates,
  createFormFromTemplateAction,
  deleteAction,
  createAction,
}: {
  templates: TemplateListRow[];
  createFormFromTemplateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
  createAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "", DIRECTORY_SORT_SELECTION_VALUES);
  const [creating, setCreating] = useState(false);
  const [using, setUsing] = useState<TemplateListRow | null>(null);
  const [deleting, setDeleting] = useState<TemplateListRow | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const filtered = query.trim()
      ? templates.filter((template) =>
          matchesDirectorySearch(query, [
            template.name,
            template.description,
            template.createdByName,
          ])
        )
      : templates;
    return sortDirectoryRows(
      filtered,
      sort,
      (template) => template.updatedAt,
      (template) => template.name
    );
  }, [templates, query, sort]);
  const paged = usePaged(visible);
  const fieldTotal = visible.reduce((sum, template) => sum + template.fieldCount, 0);

  function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await runServerAction({
        action: createAction,
        formData,
        successMessage: "Template created.",
        onSuccess: (result) => {
          setCreating(false);
          if (result.templateId) router.push(`/dashboard/templates/${result.templateId}`);
        },
        refresh: () => router.refresh(),
      });
    });
  }

  function createFromTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await runServerAction({
        action: createFormFromTemplateAction,
        formData,
        successMessage: "Form created from template.",
        onSuccess: (result) => {
          setUsing(null);
          if (result.formId) router.push(`/dashboard/forms/${result.formId}`);
        },
        refresh: () => router.refresh(),
      });
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("templateId", deleting.id);
    startTransition(async () => {
      await runServerAction({
        action: deleteAction,
        formData,
        successMessage: "Template deleted.",
        onSuccess: () => setDeleting(null),
        refresh: () => router.refresh(),
      });
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Templates</h1>
        <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-2">
          <DirectoryToolbar
            query={query}
            onQueryChange={setQuery}
            view={view}
            onViewChange={setView}
            searchPlaceholder="Search templates..."
            className="w-full lg:flex-1"
            sort={sort}
            onSortChange={(next: DirectorySort) => {
              setSort(next);
              paged.setPage(1);
            }}
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="app-btn-primary w-full justify-center px-4 py-2.5 text-sm lg:w-auto lg:shrink-0"
          >
            <Plus className="h-4 w-4" />
            New template
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {templates.length === 0
            ? "No templates yet. Create one, or save a form as a template."
            : "No templates match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((template, index) => (
            <li key={template.id} className="h-full">
              <Stagger index={index}>
                <DirectoryCard className="p-5">
                  <DirectoryCardIcon>
                    <Bookmark className="h-5 w-5" />
                  </DirectoryCardIcon>
                  <DirectoryCardTitle className="mt-4" title={template.name}>
                    {template.name}
                  </DirectoryCardTitle>
                  <p
                    className="mt-1 truncate text-sm text-muted"
                    title={template.description || "No description"}
                  >
                    {template.description || "No description"}
                  </p>
                  <p className="mt-3 truncate text-xs text-muted">
                    {pluralize(template.fieldCount, "field")} · {template.createdByName} ·{" "}
                    {formatMonthYear(template.updatedAt)}
                  </p>
                  <DirectoryCardFooter className="mt-auto border-t-0 pt-4">
                    <DirectoryCardButton
                      variant="primary"
                      onClick={() => setUsing(template)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Use template
                    </DirectoryCardButton>
                    {template.canManage ? (
                      <>
                        <DirectoryCardButton
                          href={`/dashboard/templates/${template.id}`}
                          variant="secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DirectoryCardButton>
                        <DirectoryCardButton
                          variant="danger"
                          onClick={() => setDeleting(template)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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
                <TableHeadLeft className="w-[32%]">
                  {columnLabel(visible.length, "Template", "Templates")}
                </TableHeadLeft>
                <TableHeadCenter className="w-[18%]">Created by</TableHeadCenter>
                <TableHeadCenter className="w-[12%]">
                  {columnLabel(fieldTotal, "Field", "Fields")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[18%]">Updated</TableHeadCenter>
                <TableActionsHeader className="w-[20%]" />
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((template) => (
                <DirectoryTableRow
                  key={template.id}
                  href={
                    template.canManage ? `/dashboard/templates/${template.id}` : undefined
                  }
                  ariaLabel={
                    template.canManage ? `Edit ${template.name}` : undefined
                  }
                >
                  <TableCellLeft className="truncate font-medium">{template.name}</TableCellLeft>
                  <TableCellCenter className="text-muted">{template.createdByName}</TableCellCenter>
                  <TableCellCenter className="tabular-nums">{template.fieldCount}</TableCellCenter>
                  <TableCellCenter className="whitespace-nowrap text-muted">
                    {formatMonthYear(template.updatedAt)}
                  </TableCellCenter>
                  <TableActionsCell>
                    <TableUseButton
                      label={template.name}
                      onClick={() => setUsing(template)}
                    />
                    {template.canManage ? (
                      <>
                        <TableEditLink href={`/dashboard/templates/${template.id}`} label={template.name} />
                        <TableDeleteButton
                          label={template.name}
                          onClick={() => setDeleting(template)}
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
        open={creating}
        title="New template"
        description="Build the questions once, then create a new form from this template each month."
        onClose={() => setCreating(false)}
      >
        <form onSubmit={createTemplate}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Template name
            <input
              name="name"
              required
              minLength={2}
              maxLength={160}
              autoFocus
              placeholder="Monthly client feedback"
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              placeholder="Optional note for your team"
              className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <DrawerActions>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="app-btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <ActionButton
              pending={pending}
              className="app-btn-primary px-4 py-2 text-sm"
            >
              Create template
            </ActionButton>
          </DrawerActions>
        </form>
      </SideDrawer>

      <SideDrawer
        open={Boolean(using)}
        title={using ? `Use “${using.name}”` : "Use template"}
        description="This creates a new form with a new public link. The template stays in your library."
        onClose={() => setUsing(null)}
      >
        {using ? (
          <form onSubmit={createFromTemplate}>
            <input type="hidden" name="templateId" value={using.id} />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Form title
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                defaultValue={using.name}
                className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <DrawerActions>
              <button
                type="button"
                onClick={() => setUsing(null)}
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
        ) : null}
      </SideDrawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleting ? `Delete “${deleting.name}”?` : "Delete template"}
        description="Forms already created from this template are not deleted."
        confirmLabel="Delete"
        pending={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
