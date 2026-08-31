"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Inbox } from "lucide-react";
import type { ResponseListRow } from "@/lib/responses";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { Stagger } from "@/components/ui/skeleton";
import { formatMonthYear, columnLabel } from "@/lib/format";
import { TableHeadCenter, TableHeadLeft, TableCellCenter, TableCellLeft, DirectoryTableRow } from "@/components/directory/directory-table";
import {
  DirectoryCard,
  DirectoryCardButton,
  DirectoryCardFooter,
  DirectoryCardIcon,
  DirectoryCardTitle,
} from "@/components/directory/directory-card";
import { DirectoryCardLine } from "@/components/directory/directory-card-meta";
import { sortDirectoryRows, type DirectorySort } from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

const VIEW_KEY = "optiphoenix.responsesView";
const SORT_KEY = "optiphoenix.responsesSort";

export function ResponsesDirectory({
  responses,
  formTitle,
}: {
  responses: ResponseListRow[];
  formTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(SORT_KEY, "newest", [
    "newest",
    "oldest",
    "name-asc",
    "name-desc",
  ]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? responses.filter((row) =>
          [row.formTitle, row.clientName, row.teamName, row.preview]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        )
      : responses;
    return sortDirectoryRows(
      filtered,
      sort,
      (row) => row.submittedAt,
      (row) => row.formTitle
    );
  }, [responses, query, sort]);
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
          sort={sort}
          onSortChange={(next: DirectorySort) => {
            setSort(next);
            paged.setPage(1);
          }}
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
          {responses.length === 0
            ? "No responses yet. Publish a form and share the client link to collect feedback."
            : "No responses match this search."}
        </p>
      ) : view === "grid" ? (
        <ul className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.slice.map((row, index) => (
            <li key={row.id} className="h-full">
              <Stagger index={index}>
                <DirectoryCard>
                  <DirectoryCardIcon>
                    <Inbox className="h-5 w-5" />
                  </DirectoryCardIcon>
                  <div className="mt-4 min-w-0 flex-1">
                    <DirectoryCardTitle title={row.formTitle}>{row.formTitle}</DirectoryCardTitle>
                    <dl className="mt-5 space-y-2">
                      <DirectoryCardLine label="Client" value={row.clientName} title={row.clientName} />
                      <DirectoryCardLine label="Team" value={row.teamName} title={row.teamName} />
                      <DirectoryCardLine
                        label="Submitted"
                        value={formatMonthYear(row.submittedAt)}
                      />
                      <DirectoryCardLine
                        label="Answer"
                        value={row.preview || "—"}
                        title={row.preview || undefined}
                      />
                    </dl>
                  </div>
                  <DirectoryCardFooter>
                    <DirectoryCardButton href={row.href} variant="primary">
                      <Eye className="h-3.5 w-3.5" />
                      Review
                    </DirectoryCardButton>
                  </DirectoryCardFooter>
                </DirectoryCard>
              </Stagger>
            </li>
          ))}
        </ul>
      ) : (
        <div className="directory-table-wrap mt-6">
          <table className="directory-table w-full min-w-[44rem] table-fixed text-sm">
            <thead>
              <tr>
                <TableHeadLeft className="w-[28%]">
                  {columnLabel(visible.length, "Form", "Forms")}
                </TableHeadLeft>
                <TableHeadCenter className="w-[18%]">
                  {columnLabel(visible.length, "Client", "Clients")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[16%]">
                  {columnLabel(visible.length, "Team", "Teams")}
                </TableHeadCenter>
                <TableHeadCenter className="w-[26%]">Answer</TableHeadCenter>
                <TableHeadCenter className="w-[12%]">Submitted</TableHeadCenter>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((row) => (
                <DirectoryTableRow
                  key={row.id}
                  href={row.href}
                  ariaLabel={`Review ${row.formTitle}`}
                >
                  <TableCellLeft className="font-medium">{row.formTitle}</TableCellLeft>
                  <TableCellCenter className="text-muted">{row.clientName}</TableCellCenter>
                  <TableCellCenter className="text-muted">{row.teamName}</TableCellCenter>
                  <TableCellCenter className="truncate text-muted">{row.preview}</TableCellCenter>
                  <TableCellCenter className="whitespace-nowrap text-muted">
                    {formatMonthYear(row.submittedAt)}
                  </TableCellCenter>
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
    </section>
  );
}
