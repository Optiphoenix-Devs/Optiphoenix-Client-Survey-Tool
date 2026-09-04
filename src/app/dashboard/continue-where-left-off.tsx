import Link from "next/link";
import { ArrowRight, Building2, FilePenLine, FileText } from "lucide-react";
import type { DashboardFormRow } from "@/lib/teams";
import { formatTimeAgo } from "@/lib/format";

export type ContinueItem =
  | {
      kind: "form";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      updatedAt: string;
      status: "DRAFT" | "PUBLISHED";
    }
  | {
      kind: "client";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      updatedAt: string;
    };

const MAX_ITEMS = 3;

/** Newest draft first, then a client workspace, then other recent forms. */
export function buildContinueItems(forms: DashboardFormRow[]): ContinueItem[] {
  const items: ContinueItem[] = [];
  const usedFormIds = new Set<string>();

  const newestDraft = forms.find((form) => form.status === "DRAFT");
  if (newestDraft) {
    items.push(toFormItem(newestDraft));
    usedFormIds.add(newestDraft.id);
  }

  const clientForm = forms.find(
    (form) => form.clientId && form.teamId && form.clientName !== "—"
  );
  if (clientForm?.clientId && clientForm.teamId && items.length < MAX_ITEMS) {
    items.push({
      kind: "client",
      id: clientForm.clientId,
      title: clientForm.clientName,
      subtitle:
        clientForm.teamName !== "—" ? clientForm.teamName : "Client workspace",
      href: `/dashboard/teams/${clientForm.teamId}/clients/${clientForm.clientId}`,
      updatedAt: clientForm.updatedAt,
    });
  }

  for (const form of forms) {
    if (items.length >= MAX_ITEMS) break;
    if (usedFormIds.has(form.id)) continue;
    items.push(toFormItem(form));
    usedFormIds.add(form.id);
  }

  return items;
}

function toFormItem(form: DashboardFormRow): ContinueItem {
  return {
    kind: "form",
    id: form.id,
    title: form.title,
    subtitle:
      form.clientName !== "—"
        ? form.clientName
        : form.teamName !== "—"
          ? form.teamName
          : "Independent form",
    href: form.href,
    updatedAt: form.updatedAt,
    status: form.status,
  };
}

export function ContinueWhereLeftOff({ items }: { items: ContinueItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Continue where you left off
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Jump back into a recent draft, form, or client workspace.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          Nothing to resume yet — create a form above to get started.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link
                href={item.href}
                className="card-enter group flex h-full flex-col app-radius border border-border bg-card app-shadow-card p-5 transition hover:border-accent/40"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className="flex items-start justify-between gap-3">
                  <span
                    className={
                      item.kind === "client"
                        ? "grid h-10 w-10 place-items-center app-radius bg-sky-100 text-sky-800 ring-1 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-500/30"
                        : item.status === "DRAFT"
                          ? "grid h-10 w-10 place-items-center app-radius bg-amber-100 text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-500/30"
                          : "grid h-10 w-10 place-items-center app-radius bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-500/30"
                    }
                  >
                    {item.kind === "client" ? (
                      <Building2 className="h-5 w-5" />
                    ) : item.status === "DRAFT" ? (
                      <FilePenLine className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    {formatTimeAgo(item.updatedAt)}
                  </span>
                </span>

                <p className="mt-4 truncate text-base font-semibold tracking-tight">
                  {item.title}
                </p>
                <p className="mt-1 truncate text-sm text-muted">{item.subtitle}</p>

                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-accent">
                  {item.kind === "client"
                    ? "Open client"
                    : item.status === "DRAFT"
                      ? "Continue editing"
                      : "Open form"}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
