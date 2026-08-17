"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Inbox } from "lucide-react";
import type { ResponseListRow } from "@/lib/responses";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { Stagger } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { usePersistedValue } from "@/lib/use-persisted-value";

const VIEW_KEY = "optiphoenix.responsesView";

export function ResponsesDirectory({
  responses,
  formTitle,
}: {
  responses: ResponseListRow[];
  formTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = usePersistedValue(VIEW_KEY, "grid", ["grid", "table"]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return responses;
    return responses.filter((row) =>
      [row.formTitle, row.clientName, row.teamName, row.preview]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [responses, query]);
  const paged = usePaged(visible);

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">Responses</h1>
          {formTitle ? (
            <p className="mt-1 text-sm text-muted">
              Showing submissions for {formTitle}.{" "}
              <Link href="/dashboard/responses" className="font-medium text-accent hover:text-accent-hover">
                View all
              </Link>
            </p>
          ) : null}
        </div>
        <DirectoryToolbar
          query={query}
          onQueryChange={setQuery}
          view={view}
          onViewChange={setView}
          searchPlaceholder="Search responses..."
          className="flex-1"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {responses.length === 0
            ? "No responses yet. Publish a form and share the client link to collect feedback."
            : "No responses match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((row, index) => (
            <li key={row.id}>
              <Stagger index={index}>
                <article className="relative overflow-hidden rounded-3xl border border-border bg-card p-5">
                  <span className="pointer-events-none absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-sage/15" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-sage/15 text-accent">
                      <Inbox className="h-5 w-5" />
                    </span>
                    <span className="text-xs text-muted">
                      {formatRelativeTime(row.submittedAt)}
                    </span>
                  </div>
                  <p className="mt-4 text-base font-semibold tracking-tight">{row.formTitle}</p>
                  <p className="mt-1 text-sm text-muted">
                    {row.clientName} · {row.teamName}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{row.preview}</p>
                  <Link
                    href={row.href}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                </article>
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[44rem] table-fixed text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="w-[28%] px-4 py-3 text-left font-medium">Form</th>
                <th className="w-[18%] px-4 py-3 text-left font-medium">Client</th>
                <th className="w-[16%] px-4 py-3 text-left font-medium">Team</th>
                <th className="w-[26%] px-4 py-3 text-left font-medium">Answer</th>
                <th className="w-[12%] px-4 py-3 text-left font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={row.href} className="font-medium hover:text-accent">
                      {row.formTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.clientName}</td>
                  <td className="px-4 py-3 text-muted">{row.teamName}</td>
                  <td className="truncate px-4 py-3 text-muted">{row.preview}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatRelativeTime(row.submittedAt)}
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
    </section>
  );
}
