"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PendingButton, ActionButton } from "@/components/ui/pending-button";
import {
  TableActionsCell,
  TableActionsHeader,
  TableDeleteButton,
} from "@/components/ui/table-actions";
import { Stagger } from "@/components/ui/skeleton";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { formatMonthYear, columnLabel } from "@/lib/format";
import {
  TableHeadCenter,
  TableHeadLeft,
  TableCellCenter,
  TableCellLeft,
  DirectoryTableRow,
} from "@/components/directory/directory-table";
import {
  DirectoryCard,
  DirectoryCardButton,
  DirectoryCardFooter,
  DirectoryCardIcon,
  DirectoryCardTitle,
} from "@/components/directory/directory-card";
import { runServerAction } from "@/lib/run-server-action";
import { sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { createForm, deleteForm } from "./actions";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/pending-button";

type FormsFilter = "all" | "published" | "drafts";

type ClientFormRow = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  fieldCount: number;
  responseCount: number;
  updatedAt: string;
};

const VIEW_KEY = "optiphoenix.clientFormsView";
const SORT_KEY = "optiphoenix.clientFormsSort";

const FILTERS: Array<{ id: FormsFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
];

export function ClientWorkspace({
  teamId,
  clientId,
  teamName,
  name,
  email,
  company,
  forms,
  templates = [],
  draftForms = [],
}: {
  teamId: string;
  clientId: string;
  teamName: string;
  name: string;
  email: string | null;
  company: string | null;
  forms: ClientFormRow[];
  templates?: Array<{ id: string; name: string; fieldCount: number }>;
  draftForms?: Array<{ id: string; title: string; fieldCount: number }>;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<ClientFormRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FormsFilter>("all");
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);
  const publishedCount = forms.filter((form) => form.status === "PUBLISHED").length;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = forms.filter((form) => {
      const statusOk =
        filter === "all" ||
        (filter === "published" && form.status === "PUBLISHED") ||
        (filter === "drafts" && form.status === "DRAFT");
      if (!statusOk) return false;
      if (!needle) return true;
      return (
        form.title.toLowerCase().includes(needle) ||
        (form.description ?? "").toLowerCase().includes(needle)
      );
    });
    return sortDirectoryRows(
      filtered,
      sort,
      (form) => form.updatedAt,
      (form) => form.title
    );
  }, [forms, filter, query, sort]);
  const paged = usePaged(visible);
  const fieldTotal = visible.reduce((sum, form) => sum + form.fieldCount, 0);
  const responseTotal = visible.reduce((sum, form) => sum + form.responseCount, 0);

  function confirmDelete() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", deleting.id);
    startTransition(async () => {
      await runServerAction({
        action: deleteForm,
        formData,
        successMessage: "Form deleted.",
        onSuccess: () => setDeleting(null),
        refresh: () => router.refresh(),
      });
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <p className="text-sm text-muted">
        <Link href="/dashboard/teams" className="text-accent hover:text-accent-hover">
          Teams
        </Link>
        {" / "}
        <Link
          href={`/dashboard/teams/${teamId}`}
          className="text-accent hover:text-accent-hover"
        >
          {teamName}
        </Link>
        {" / "}
        {name}
      </p>

      <header className="card-enter overflow-hidden app-radius border border-border bg-card app-shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 place-items-center app-radius bg-sage/20 text-lg font-semibold text-accent">
              {initials || "C"}
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {email || "No email"}
                </span>
                <span>{company || "No organization"}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="app-radius bg-hover px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{forms.length}</p>
              <p className="text-xs text-muted">Forms</p>
            </div>
            <div className="app-radius bg-sage/15 px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{publishedCount}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
            <Link
              href={`/dashboard/insights?client=${clientId}`}
              className="inline-flex items-center gap-1.5 app-radius border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-hover"
            >
              <BarChart3 className="h-4 w-4 text-accent" />
              Insights
            </Link>
            <Link
              href={`/dashboard/summarize?client=${clientId}`}
              className="inline-flex items-center gap-1.5 app-radius border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-hover"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              Summarize
            </Link>
          </div>
        </div>
      </header>

      <section className="card-enter app-radius border border-border bg-card app-shadow-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Add a feedback form</h2>
        <p className="mt-1 text-sm text-muted">
          Start blank, from a template, or from an existing draft. Title is editable on
          the builder — this client is already linked so you can publish.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const picked = String(formData.get("pick") ?? "blank");
            if (picked.startsWith("template:")) {
              formData.set("source", "template");
              formData.set("templateId", picked.slice("template:".length));
            } else if (picked.startsWith("draft:")) {
              formData.set("source", "draft");
              formData.set("draftFormId", picked.slice("draft:".length));
            } else {
              formData.set("source", "blank");
            }
            const successMessage = picked.startsWith("draft:")
              ? "Draft linked to this client."
              : "Form ready in the builder.";
            startTransition(async () => {
              await runServerAction({
                action: createForm,
                formData,
                successMessage,
                onSuccess: (result) => {
                  if (result.formId) {
                    router.push(`/dashboard/forms/${result.formId}`);
                  }
                },
                refresh: () => router.refresh(),
              });
            });
          }}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="clientId" value={clientId} />
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium">
            Start from
            <Select name="pick" defaultValue="blank" className="app-radius py-2.5 pr-10">
              <option value="blank">Blank form</option>
              {templates.length > 0 ? (
                <optgroup label="Templates">
                  {templates.map((template) => (
                    <option key={template.id} value={`template:${template.id}`}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {draftForms.length > 0 ? (
                <optgroup label="Forms">
                  {draftForms.map((draft) => (
                    <option key={draft.id} value={`draft:${draft.id}`}>
                      {draft.title}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </Select>
          </label>
          <ActionButton
            pending={pending}
            className="app-btn-primary justify-center px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Continue to builder
          </ActionButton>
        </form>
      </section>

      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <h2 className="shrink-0 text-lg font-semibold tracking-tight">Feedback forms</h2>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex shrink-0 app-radius border border-border bg-surface p-1">
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
            <DirectoryToolbar
              query={query}
              onQueryChange={setQuery}
              view={view}
              onViewChange={setView}
              searchPlaceholder="Search forms..."
              className="min-w-0"
              sort={sort}
              onSortChange={(next: DirectorySort) => {
                setSort(next);
                paged.setPage(1);
              }}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
            {forms.length === 0
              ? "No forms for this client yet."
              : "No forms match this filter."}
          </p>
        ) : view === "grid" ? (
          <ul className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.slice.map((form, index) => {
              const published = form.status === "PUBLISHED";
              const href = `/dashboard/forms/${form.id}`;
              return (
                <li key={form.id} className="h-full">
                  <Stagger index={index}>
                    <DirectoryCard className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <DirectoryCardIcon>
                          <FileText className="h-5 w-5" />
                        </DirectoryCardIcon>
                        <span
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                            published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
                          )}
                        >
                          {published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <DirectoryCardTitle className="mt-4 min-h-[3rem]" title={form.title}>
                        {form.title}
                      </DirectoryCardTitle>
                      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
                        {form.description ||
                          `${form.fieldCount} fields · ${form.responseCount} responses`}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        {formatMonthYear(form.updatedAt)}
                      </p>
                      <DirectoryCardFooter className="mt-auto border-t-0 pt-5">
                        <DirectoryCardButton href={href} variant="primary">
                          Build
                        </DirectoryCardButton>
                        <DirectoryCardButton
                          variant="danger"
                          onClick={() => setDeleting(form)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DirectoryCardButton>
                      </DirectoryCardFooter>
                    </DirectoryCard>
                  </Stagger>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="directory-table-wrap card-enter mt-6">
            <table className="directory-table w-full min-w-[48rem] table-fixed text-sm">
              <thead>
                <tr>
                  <TableHeadLeft className="w-[26%]">
                    {columnLabel(visible.length, "Form", "Forms")}
                  </TableHeadLeft>
                  <TableHeadCenter className="w-[14%]">Status</TableHeadCenter>
                  <TableHeadCenter className="w-[12%]">
                    {columnLabel(fieldTotal, "Field", "Fields")}
                  </TableHeadCenter>
                  <TableHeadCenter className="w-[14%]">
                    {columnLabel(responseTotal, "Response", "Responses")}
                  </TableHeadCenter>
                  <TableHeadCenter className="w-[16%]">Updated</TableHeadCenter>
                  <TableActionsHeader className="w-[18%]" />
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((form) => {
                  const published = form.status === "PUBLISHED";
                  const href = `/dashboard/forms/${form.id}`;
                  return (
                    <DirectoryTableRow
                      key={form.id}
                      href={href}
                      ariaLabel={`Open ${form.title}`}
                    >
                      <TableCellLeft>
                        <span className="block truncate font-medium">{form.title}</span>
                        {form.description ? (
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {form.description}
                          </p>
                        ) : null}
                      </TableCellLeft>
                      <TableCellCenter>
                        <span
                          className={cn(
                            "inline-flex whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                            published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
                          )}
                        >
                          {published ? "Published" : "Draft"}
                        </span>
                      </TableCellCenter>
                      <TableCellCenter className="tabular-nums">
                        {form.fieldCount}
                      </TableCellCenter>
                      <TableCellCenter className="tabular-nums">
                        <Link
                          href={`/dashboard/responses?form=${form.id}`}
                          className="hover:text-accent"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {form.responseCount}
                        </Link>
                      </TableCellCenter>
                      <TableCellCenter className="whitespace-nowrap text-muted">
                        {formatMonthYear(form.updatedAt)}
                      </TableCellCenter>
                      <TableActionsCell className="w-[18%]">
                        <Link
                          href={href}
                          className="inline-flex h-8 items-center rounded-full px-3 text-xs font-medium text-accent transition hover:bg-hover"
                        >
                          Build
                        </Link>
                        <TableDeleteButton
                          label={form.title}
                          onClick={() => setDeleting(form)}
                        />
                      </TableActionsCell>
                    </DirectoryTableRow>
                  );
                })}
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
      </section>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Are you absolutely sure?"
        description={
          deleting
            ? `This will permanently delete “${deleting.title}” and its fields. This cannot be undone.`
            : "This will permanently delete this form."
        }
        confirmLabel="Delete form"
        pending={pending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
