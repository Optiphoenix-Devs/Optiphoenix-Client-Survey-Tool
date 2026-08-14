"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Plus, Search, Table2 } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import type { DashboardFormRow } from "@/lib/teams";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { DrawerActions, SideDrawer } from "@/components/ui/side-drawer";
import { toast } from "@/components/ui/toaster";
import { Stagger } from "@/components/ui/skeleton";

type FormsFilter = "all" | "published" | "drafts";
type FormsView = "grid" | "table";

export type FormClientOption = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
};

const VIEW_STORAGE_KEY = "optiphoenix.formsView";

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
  clients = [],
  createAction,
}: {
  forms: DashboardFormRow[];
  title?: string;
  clients?: FormClientOption[];
  createAction?: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("forms"));
  const [view, setView] = useState<FormsView>("grid");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canCreate = Boolean(createAction);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "grid" || stored === "table") {
      setView(stored);
    }
  }, []);

  function setFormsView(next: FormsView) {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

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

  const visible = filterForms(forms, filter, query);
  const paged = usePaged(visible);
  const selectedClient = clients.find((client) => client.id === clientId);

  function closeDrawer() {
    setDrawerOpen(false);
    setError(null);
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createAction) return;
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createAction(formData);
      if (result?.error) {
        setError(result.error);
        toast(result.error, { tone: "error" });
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
          <div
            className="flex rounded-full border border-border bg-surface p-1"
            role="group"
            aria-label="Forms layout"
          >
            <button
              type="button"
              onClick={() => setFormsView("grid")}
              aria-pressed={view === "grid"}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full",
                view === "grid"
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:text-foreground"
              )}
              title="Card grid"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Card grid</span>
            </button>
            <button
              type="button"
              onClick={() => setFormsView("table")}
              aria-pressed={view === "table"}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full",
                view === "table"
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:text-foreground"
              )}
              title="Table"
            >
              <Table2 className="h-4 w-4" />
              <span className="sr-only">Table</span>
            </button>
          </div>
          {canCreate ? (
            <button
              type="button"
              disabled={clients.length === 0}
              title={clients.length === 0 ? "Add a client first" : undefined}
              onClick={() => {
                setError(null);
                setClientId(clients[0]?.id ?? "");
                setDrawerOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              New form
            </button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {forms.length === 0
            ? canCreate
              ? clients.length === 0
                ? "Add a client first, then create a form for them."
                : "No forms yet. Create the first one."
              : "No forms yet. Open a client to create the first one."
            : "No forms match this filter."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((form, index) => (
            <li key={form.id}>
              <Stagger index={index}>
                <FormCard form={form} />
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-enter mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Form</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 text-right font-medium">Fields</th>
                <th className="px-4 py-3 text-right font-medium">Responses</th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((form) => (
                <tr key={form.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={form.href} className="font-medium hover:text-accent">
                      {form.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatRelativeTime(form.updatedAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">{form.clientName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={form.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{form.teamName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{form.fieldCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{form.responseCount}</td>
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
          description="Choose a client, then name the form. You’ll land in the builder."
          onClose={closeDrawer}
        >
          {clients.length === 0 ? (
            <p className="text-sm text-muted">
              Add a client first.{" "}
              <Link href="/dashboard/clients" className="font-medium text-accent hover:text-accent-hover">
                Go to Clients
              </Link>
            </p>
          ) : (
            <form onSubmit={submitCreate}>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Client
                <select
                  name="clientId"
                  required
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} · {client.teamName}
                    </option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="teamId" value={selectedClient?.teamId ?? ""} />
              <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
                Form title
                <input
                  name="title"
                  required
                  minLength={2}
                  maxLength={160}
                  autoFocus
                  placeholder="Q3 client feedback"
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              {error ? (
                <p className="mt-3 rounded-xl border border-rose-700 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
                  {error}
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
                  disabled={pending || !selectedClient}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
                >
                  {pending ? "Creating…" : "Create form"}
                </button>
              </DrawerActions>
            </form>
          )}
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

function FormCard({ form }: { form: DashboardFormRow }) {
  return (
    <Link
      href={form.href}
      className="relative block overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(20,38,28,0.04)] transition hover:border-accent/30 hover:bg-surface"
    >
      <span className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-sage/15" />
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={form.status} />
        <span className="text-xs text-muted">{formatRelativeTime(form.updatedAt)}</span>
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight">{form.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-muted">
        {form.description || `${form.clientName} · ${form.teamName}`}
      </p>
      <p className="mt-5 text-xs text-muted">
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
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        published ? "bg-sage/20 text-accent" : "bg-hover text-muted"
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
