"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PendingButton } from "@/components/ui/pending-button";
import { toast } from "@/components/ui/toaster";
import { Stagger } from "@/components/ui/skeleton";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { formatMonthYear } from "@/lib/format";
import { sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { createForm, deleteForm } from "./actions";

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
}: {
  teamId: string;
  clientId: string;
  teamName: string;
  name: string;
  email: string | null;
  company: string | null;
  forms: ClientFormRow[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<ClientFormRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FormsFilter>("all");
  const [view, setView] = usePersistedValue(VIEW_KEY, "grid", ["grid", "table"]);
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

  function confirmDelete() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("teamId", teamId);
    formData.set("clientId", clientId);
    formData.set("formId", deleting.id);
    startTransition(async () => {
      const result = await deleteForm(formData);
      if (result.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      toast("Form deleted.", { tone: "success" });
      setDeleting(null);
      router.refresh();
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

      <header className="card-enter overflow-hidden rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sage/20 text-lg font-semibold text-accent">
              {initials || "C"}
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {email || "No email"}
                </span>
                <span>{company || "No company"}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-hover px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{forms.length}</p>
              <p className="text-xs text-muted">Forms</p>
            </div>
            <div className="rounded-2xl bg-sage/15 px-4 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums">{publishedCount}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
            <Link
              href={`/dashboard/insights?client=${clientId}`}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-hover"
            >
              <BarChart3 className="h-4 w-4 text-accent" />
              Insights
            </Link>
            <Link
              href={`/dashboard/summarize?client=${clientId}`}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium hover:bg-hover"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              Summarize
            </Link>
          </div>
        </div>
      </header>

      <section className="card-enter rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">New feedback form</h2>
        <p className="mt-1 text-sm text-muted">
          Forms can also be created from Templates. After creating, pick field types
          and drag them into order.
        </p>
        <form
          action={async (formData) => {
            const result = await createForm(formData);
            if (result?.error) {
              toast(result.error, { tone: "error" });
              return;
            }
            toast("Form created.", { tone: "success" });
            if (result.formId) {
              router.push(`/dashboard/forms/${result.formId}`);
            }
          }}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="clientId" value={clientId} />
          <input
            name="title"
            required
            minLength={2}
            placeholder="Form title, e.g. Q1 delivery feedback"
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <PendingButton
            className="justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
            pendingLabel="Creating…"
          >
            <Plus className="h-4 w-4" />
            Create form
          </PendingButton>
        </form>
      </section>

      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <h2 className="shrink-0 text-lg font-semibold tracking-tight">Feedback forms</h2>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <div className="flex shrink-0 rounded-full border border-border bg-surface p-1">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium",
                    filter === item.id
                      ? "bg-accent text-on-accent"
                      : "text-muted hover:text-foreground"
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
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
            {forms.length === 0
              ? "No forms for this client yet."
              : "No forms match this filter."}
          </p>
        ) : view === "grid" ? (
          <ul className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.slice.map((form, index) => {
              const published = form.status === "PUBLISHED";
              const href = `/dashboard/forms/${form.id}`;
              return (
                <li key={form.id} className="h-full">
                  <Stagger index={index}>
                    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-5">
                      <span className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-sage/15" />
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                            published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
                          )}
                        >
                          {published ? "Published" : "Draft"}
                        </span>
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-hover text-accent">
                          <FileText className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="mt-4 line-clamp-2 min-h-[3rem] text-base font-semibold tracking-tight">
                        {form.title}
                      </p>
                      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
                        {form.description ||
                          `${form.fieldCount} fields · ${form.responseCount} responses`}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        {formatMonthYear(form.updatedAt)}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <Link
                          href={href}
                          prefetch
                          className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
                        >
                          Build
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleting(form)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </article>
                  </Stagger>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="card-enter mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[48rem] table-fixed text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="w-[26%] px-4 py-3 text-left font-medium">Form</th>
                  <th className="w-[14%] px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-[12%] px-4 py-3 text-center font-medium">Fields</th>
                  <th className="w-[14%] px-4 py-3 text-center font-medium">Responses</th>
                  <th className="w-[16%] px-4 py-3 text-left font-medium">Updated</th>
                  <th className="w-[18%] px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((form) => {
                  const published = form.status === "PUBLISHED";
                  const href = `/dashboard/forms/${form.id}`;
                  return (
                    <tr key={form.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-left align-middle">
                        <Link
                          href={href}
                          className="block truncate font-medium hover:text-accent"
                        >
                          {form.title}
                        </Link>
                        {form.description ? (
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {form.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-left align-middle">
                        <span
                          className={cn(
                            "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                            published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
                          )}
                        >
                          {published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle tabular-nums">
                        {form.fieldCount}
                      </td>
                      <td className="px-4 py-3 text-center align-middle tabular-nums">
                        <Link
                          href={`/dashboard/responses?form=${form.id}`}
                          className="hover:text-accent"
                        >
                          {form.responseCount}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-left align-middle whitespace-nowrap text-muted">
                        {formatMonthYear(form.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex flex-nowrap justify-end gap-3">
                          <Link
                            href={href}
                            className="text-sm font-medium whitespace-nowrap text-accent hover:text-accent-hover"
                          >
                            Build
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleting(form)}
                            className="text-sm font-medium whitespace-nowrap text-rose-800 hover:text-rose-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
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
