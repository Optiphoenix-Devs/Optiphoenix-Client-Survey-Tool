"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Plus, Search, Table2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { DashboardFormRow } from "@/lib/teams";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/lib/format";
import { DIRECTORY_SORT_OPTIONS, sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { toast } from "@/components/ui/toaster";
import { Stagger } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
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
}: {
  forms: DashboardFormRow[];
  title?: string;
  templates?: TemplateOption[];
  createAction?: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("forms"));
  const [view, setView] = usePersistedValue(VIEW_STORAGE_KEY, "grid", [
    "grid",
    "table",
  ]);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const canCreate = Boolean(createAction);

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

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createAction) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAction(formData);
      if (result?.error) {
        toast(result.error, { tone: "error" });
        return;
      }
      toast("Form created.", { tone: "success" });
      closeDrawer();
      if (result.formId) {
        router.push(`/dashboard/forms/${result.formId}`);
      }
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
          <div className="flex rounded-full border border-border bg-surface p-1">
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
          <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <span className="sr-only">Search forms</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search forms..."
              className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
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
              className="rounded-full py-2"
            >
              {DIRECTORY_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <div
            className="flex rounded-full border border-border bg-surface p-1"
            role="group"
            aria-label="Forms layout"
          >
            <Tooltip label="Card grid" side="bottom">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full",
                  view === "grid"
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:text-foreground"
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
                  "grid h-8 w-8 place-items-center rounded-full",
                  view === "table"
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:text-foreground"
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New form
            </button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
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
        <ul className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((form, index) => (
            <li key={form.id} className="h-full">
              <Stagger index={index}>
                <FormCard form={form} />
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-enter mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[44rem] table-fixed text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="w-[28%] px-4 py-3 text-left font-medium">Form</th>
                <th className="w-[18%] px-4 py-3 text-left font-medium">Client</th>
                <th className="w-[12%] px-4 py-3 text-left font-medium">Status</th>
                <th className="w-[16%] px-4 py-3 text-left font-medium">Team</th>
                <th className="w-[13%] px-4 py-3 text-center font-medium">Fields</th>
                <th className="w-[13%] px-4 py-3 text-center font-medium">Responses</th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((form) => (
                <tr key={form.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-left align-middle">
                    <Link href={form.href} className="block truncate font-medium hover:text-accent">
                      {form.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {formatMonthYear(form.updatedAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle text-muted">{form.clientName}</td>
                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={form.status} />
                  </td>
                  <td className="truncate px-4 py-3 align-middle text-muted">{form.teamName}</td>
                  <td className="px-4 py-3 align-middle text-center tabular-nums">{form.fieldCount}</td>
                  <td className="px-4 py-3 align-middle text-center tabular-nums">
                    <Link
                      href={`/dashboard/responses?form=${form.id}`}
                      className="hover:text-accent"
                    >
                      {form.responseCount}
                    </Link>
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

      {canCreate ? (
        <SideDrawer
          open={drawerOpen}
          title="New form"
          description="Start blank or pick a template. Each published link can be submitted once."
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
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
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
        </SideDrawer>
      ) : null}
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

function formOwnerLabel(form: DashboardFormRow) {
  const parts = [form.clientName, form.teamName].filter(
    (name) => name && name !== "—"
  );
  return parts.length > 0 ? parts.join(" · ") : "Independent form";
}

function FormCard({ form }: { form: DashboardFormRow }) {
  return (
    <Link
      href={form.href}
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(20,38,28,0.04)] transition hover:border-accent/30 hover:bg-surface"
    >
      <span className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-sage/15" />
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={form.status} />
        <span className="text-xs whitespace-nowrap text-muted">{formatMonthYear(form.updatedAt)}</span>
      </div>
      <p className="mt-4 line-clamp-2 min-h-[3rem] text-base font-semibold tracking-tight">{form.title}</p>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
        {form.description || formOwnerLabel(form)}
      </p>
      <p className="mt-auto pt-5 text-xs text-muted">
        {form.responseCount} responses · {form.fieldCount} fields
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: DashboardFormRow["status"] }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
