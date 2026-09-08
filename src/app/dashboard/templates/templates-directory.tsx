"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, EyeOff, Eye, Pencil, Plus, Share2, Trash2, X } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { TemplateListRow } from "@/lib/templates";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Stagger } from "@/components/ui/skeleton";
import { ActionButton } from "@/components/ui/pending-button";
import {
  TableActionsCell,
  TableActionsHeader,
  TableDeleteButton,
  TableEditLink,
  TableShareButton,
  TableUseButton,
} from "@/components/ui/table-actions";
import { Tooltip } from "@/components/ui/tooltip";
import { formatMonthYear, columnLabel, pluralize } from "@/lib/format";
import { matchesDirectorySearch } from "@/lib/directory-search";
import { TableHeadCenter, TableHeadLeft, TableCellCenter, TableCellLeft, DirectoryTableRow } from "@/components/directory/directory-table";
import {
  DirectoryCard,
  DirectoryCardButton,
  DirectoryCardFooter,
  DirectoryCardIcon,
} from "@/components/directory/directory-card";
import { runServerAction } from "@/lib/run-server-action";
import {
  DIRECTORY_SORT_PLACEHOLDER,
  DIRECTORY_SORT_SELECTION_VALUES,
  sortDirectoryRows,
  type DirectorySort,
} from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

const VIEW_KEY = "optiphoenix.templatesView";
const SORT_KEY = "optiphoenix.templatesSort.v3";

export function TemplatesDirectory({
  templates,
  createFormFromTemplateAction,
  deleteAction,
  createAction,
  shareAction,
  hideAction,
  unhideAction,
}: {
  templates: TemplateListRow[];
  createFormFromTemplateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
  createAction: (formData: FormData) => Promise<ActionResult>;
  shareAction: (formData: FormData) => Promise<ActionResult>;
  hideAction: (formData: FormData) => Promise<ActionResult>;
  unhideAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(
    SORT_KEY,
    DIRECTORY_SORT_PLACEHOLDER,
    DIRECTORY_SORT_SELECTION_VALUES
  );
  const [showHidden, setShowHidden] = useState(false);
  const [creating, setCreating] = useState(false);
  const [using, setUsing] = useState<TemplateListRow | null>(null);
  const [sharing, setSharing] = useState<TemplateListRow | null>(null);
  const [deleting, setDeleting] = useState<TemplateListRow | null>(null);
  const [pending, startTransition] = useTransition();

  const hiddenCount = templates.filter((template) => template.isHidden).length;

  const visible = useMemo(() => {
    const base = showHidden
      ? templates
      : templates.filter((template) => !template.isHidden);
    const filtered = query.trim()
      ? base.filter((template) =>
          matchesDirectorySearch(query, [
            template.name,
            template.description,
            template.createdByName,
          ])
        )
      : base;
    return sortDirectoryRows(
      filtered,
      sort,
      (template) => template.updatedAt,
      (template) => template.name
    );
  }, [templates, query, sort, showHidden]);
  const paged = usePaged(visible);
  const fieldTotal = visible.reduce((sum, template) => sum + template.fieldCount, 0);

  function runTemplateAction(
    action: (formData: FormData) => Promise<ActionResult>,
    templateId: string,
    successMessage: string
  ) {
    const formData = new FormData();
    formData.set("templateId", templateId);
    startTransition(async () => {
      await runServerAction({
        action,
        formData,
        successMessage,
        refresh: () => router.refresh(),
      });
    });
  }

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
          // Navigate away — skip router.refresh() so we do not wait on a
          // full RSC reload of the templates list after the insert.
          if (result.templateId) {
            router.push(`/dashboard/templates/${result.templateId}`);
          }
        },
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
        successMessage: "Template removed.",
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
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              setShowHidden((value) => !value);
              paged.setPage(1);
            }}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            {showHidden ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {showHidden
              ? "Hide shared templates you’ve tucked away"
              : `Show ${hiddenCount} hidden template${hiddenCount === 1 ? "" : "s"}`}
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {templates.length === 0
            ? "No templates yet. Create one, or save a form as a template."
            : !showHidden && hiddenCount > 0
              ? "All shared templates are hidden. Show them above if you need one again."
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
                  <h3
                    className="directory-card-title mt-4 min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl"
                    title={template.name}
                  >
                    {template.name}
                  </h3>
                  <p
                    className="mt-1 line-clamp-2 min-h-[2.75rem] min-w-0 text-sm leading-[1.375rem] text-muted"
                    title={template.description || "No description"}
                  >
                    {template.description || "No description"}
                  </p>
                  <p className="mt-3 truncate text-xs text-muted">
                    {pluralize(template.fieldCount, "field")} · Created by:{" "}
                    {template.createdByName} · {formatMonthYear(template.updatedAt)}
                    {template.isHidden ? " · Hidden" : null}
                  </p>
                  <DirectoryCardFooter className="mt-auto flex-col items-stretch gap-2 border-t-0 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <DirectoryCardButton
                        variant="primary"
                        onClick={() => setUsing(template)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Use template
                      </DirectoryCardButton>
                      {template.canManage ? (
                        <DirectoryCardButton
                          variant="danger"
                          onClick={() => setDeleting(template)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </DirectoryCardButton>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.canHide ? (
                        <DirectoryCardButton
                          variant="secondary"
                          onClick={() =>
                            runTemplateAction(
                              template.isHidden ? unhideAction : hideAction,
                              template.id,
                              template.isHidden
                                ? "Template shown again."
                                : "Template hidden from your board."
                            )
                          }
                        >
                          {template.isHidden ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          {template.isHidden ? "Show" : "Hide"}
                        </DirectoryCardButton>
                      ) : null}
                      <DirectoryCardButton
                        href={`/dashboard/templates/${template.id}`}
                        variant="secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {template.canManage ? "Edit" : "Open"}
                      </DirectoryCardButton>
                      {template.canShare ? (
                        <DirectoryCardButton
                          variant="secondary"
                          onClick={() => setSharing(template)}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </DirectoryCardButton>
                      ) : null}
                    </div>
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
                  href={`/dashboard/templates/${template.id}`}
                  ariaLabel={
                    template.canManage
                      ? `Edit ${template.name}`
                      : `Open ${template.name}`
                  }
                >
                  <TableCellLeft className="truncate font-medium">
                    {template.name}
                    {template.isHidden ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        Hidden
                      </span>
                    ) : null}
                  </TableCellLeft>
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
                    {template.canShare ? (
                      <TableShareButton
                        label={template.name}
                        onClick={() => setSharing(template)}
                      />
                    ) : null}
                    {template.canHide ? (
                      <Tooltip
                        label={template.isHidden ? "Show" : "Hide"}
                        side="top"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            runTemplateAction(
                              template.isHidden ? unhideAction : hideAction,
                              template.id,
                              template.isHidden
                                ? "Template shown again."
                                : "Template hidden from your board."
                            )
                          }
                          className="app-icon-action-btn"
                          aria-label={
                            template.isHidden
                              ? `Show ${template.name}`
                              : `Hide ${template.name}`
                          }
                        >
                          {template.isHidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </Tooltip>
                    ) : null}
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
              <X className="h-4 w-4" />
              Cancel
            </button>
            <ActionButton
              pending={pending}
              icon={<Plus className="h-4 w-4" />}
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
                <X className="h-4 w-4" />
                Cancel
              </button>
              <ActionButton
                pending={pending}
                icon={<Plus className="h-4 w-4" />}
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
        title={deleting ? `Remove “${deleting.name}”?` : "Remove template"}
        description="Are you sure?"
        pending={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <Modal
        open={Boolean(sharing)}
        onClose={() => {
          if (!pending) setSharing(null);
        }}
        labelledBy="share-template-title"
        className="max-w-md"
      >
        {sharing ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="share-template-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  Share template
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Enter a member’s email. The template will appear on their
                  Templates board so they can use it.
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => setSharing(null)}
                aria-label="Close"
                className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center text-muted transition hover:bg-hover hover:text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <p className="truncate text-sm font-medium">{sharing.name}</p>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                formData.set("templateId", sharing.id);
                startTransition(async () => {
                  await runServerAction({
                    action: shareAction,
                    formData,
                    successMessage: "Template shared.",
                    onSuccess: () => setSharing(null),
                    refresh: () => router.refresh(),
                  });
                });
              }}
            >
              <label className="grid gap-1.5 text-sm font-medium">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="colleague@company.com"
                  className="app-radius border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setSharing(null)}
                  className="app-btn-secondary px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <ActionButton
                  type="submit"
                  pending={pending}
                  disabled={pending}
                  icon={<Share2 className="h-4 w-4" />}
                  className="app-btn-primary px-4 py-2.5 text-sm"
                >
                  Share
                </ActionButton>
              </div>
            </form>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
