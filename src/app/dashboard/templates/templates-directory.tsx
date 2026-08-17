"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { TemplateListRow } from "@/lib/templates";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Stagger } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { formatMonthYear, pluralize } from "@/lib/format";
import { sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { usePersistedValue } from "@/lib/use-persisted-value";

const VIEW_KEY = "optiphoenix.templatesView";
const SORT_KEY = "optiphoenix.templatesSort";

export function TemplatesDirectory({
  templates,
  useAction,
  deleteAction,
  createAction,
}: {
  templates: TemplateListRow[];
  useAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
  createAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = usePersistedValue(VIEW_KEY, "grid", ["grid", "table"]);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);
  const [creating, setCreating] = useState(false);
  const [using, setUsing] = useState<TemplateListRow | null>(null);
  const [deleting, setDeleting] = useState<TemplateListRow | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? templates.filter((template) =>
          [template.name, template.description ?? "", template.createdByName]
            .join(" ")
            .toLowerCase()
            .includes(needle)
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

  function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAction(formData);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      toast("Template created.", { tone: "success" });
      setCreating(false);
      if (result.templateId) router.push(`/dashboard/templates/${result.templateId}`);
    });
  }

  function createFromTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await useAction(formData);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      toast("Form created from template.", { tone: "success" });
      setUsing(null);
      if (result.formId) router.push(`/dashboard/forms/${result.formId}`);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("templateId", deleting.id);
    startTransition(async () => {
      const result = await deleteAction(formData);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      toast("Template deleted.", { tone: "success" });
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="shrink-0 text-3xl font-semibold tracking-tight">Templates</h1>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <DirectoryToolbar
            query={query}
            onQueryChange={setQuery}
            view={view}
            onViewChange={setView}
            searchPlaceholder="Search templates..."
            sort={sort}
            onSortChange={(next: DirectorySort) => {
              setSort(next);
              paged.setPage(1);
            }}
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New template
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">
        Reuse the same questions each month. A new form gets a new public link.
      </p>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {templates.length === 0
            ? "No templates yet. Create one, or save a form as a template."
            : "No templates match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((template, index) => (
            <li key={template.id} className="h-full">
              <Stagger index={index}>
                <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-5">
                  <span className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-sage/15" />
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-sage/15 text-accent">
                    <Bookmark className="h-5 w-5" />
                  </span>
                  <p
                    className="mt-4 truncate text-base font-semibold tracking-tight"
                    title={template.name}
                  >
                    {template.name}
                  </p>
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
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setUsing(template)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Use template
                    </button>
                    {template.canManage ? (
                      <>
                        <Link
                          href={`/dashboard/templates/${template.id}`}
                          className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-hover"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleting(template)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[40rem] table-fixed text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="w-[32%] px-4 py-3 text-left font-medium">Template</th>
                <th className="w-[18%] px-4 py-3 text-left font-medium">Created by</th>
                <th className="w-[12%] px-4 py-3 text-center font-medium">Fields</th>
                <th className="w-[18%] px-4 py-3 text-left font-medium">Updated</th>
                <th className="w-[20%] px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((template) => (
                <tr key={template.id} className="border-b border-border last:border-0">
                  <td className="truncate px-4 py-3 align-middle font-medium">{template.name}</td>
                  <td className="px-4 py-3 align-middle text-muted">{template.createdByName}</td>
                  <td className="px-4 py-3 align-middle text-center tabular-nums">{template.fieldCount}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted">
                    {formatMonthYear(template.updatedAt)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-nowrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setUsing(template)}
                        className="text-sm font-medium text-accent hover:text-accent-hover"
                      >
                        Use
                      </button>
                      {template.canManage ? (
                        <>
                          <Link
                            href={`/dashboard/templates/${template.id}`}
                            className="text-sm font-medium text-accent hover:text-accent-hover"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleting(template)}
                            className="text-sm font-medium text-rose-800 hover:text-rose-900"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
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
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              placeholder="Optional note for your team"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <DrawerActions>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create template"}
            </button>
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
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <DrawerActions>
              <button
                type="button"
                onClick={() => setUsing(null)}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create form"}
              </button>
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
