"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Inbox } from "lucide-react";
import type { ResponseListRow, ResponsesPageResult } from "@/lib/responses";
import { RESPONSE_PAGE_SIZE } from "@/lib/page-size";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/pending-button";
import { Stagger } from "@/components/ui/skeleton";
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
import { DirectoryCardLine } from "@/components/directory/directory-card-meta";
import {
  DIRECTORY_SORT_SELECTION_VALUES,
  resolveDirectorySort,
  type DirectorySort,
} from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { scrollToPageTop } from "@/lib/scroll-to-page-top";
import { fetchResponsesPageAction } from "./actions";
import { matchesResponseCardSearch } from "@/lib/directory-search";

const VIEW_KEY = "optiphoenix.responsesView";
const SORT_KEY = "optiphoenix.responsesSort.v2";

type CacheEntry = { rows: ResponseListRow[]; total: number };

function cacheKey(
  page: number,
  query: string,
  sort: DirectorySort,
  formId?: string
) {
  return `${formId ?? "all"}:${sort}:${query}:${page}`;
}

export function ResponsesDirectory({
  initialPage,
  formId,
  formTitle,
}: {
  initialPage: ResponsesPageResult;
  formId?: string;
  formTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialPage.total);
  const [rows, setRows] = useState(initialPage.rows);
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(
    SORT_KEY,
    "",
    DIRECTORY_SORT_SELECTION_VALUES
  );
  const effectiveSort = resolveDirectorySort(sort);
  const cacheRef = useRef(new Map<string, CacheEntry>());
  const [loading, startLoad] = useTransition();
  const filtersRef = useRef({
    debouncedQuery: "",
    sort: "" as (typeof DIRECTORY_SORT_SELECTION_VALUES)[number],
    formId,
  });

  useEffect(() => {
    cacheRef.current.set(cacheKey(1, "", "newest", formId), {
      rows: initialPage.rows,
      total: initialPage.total,
    });
  }, [formId, initialPage.rows, initialPage.total]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadPage = useCallback(
    (nextPage: number, nextQuery: string, nextSort: DirectorySort) => {
      const key = cacheKey(nextPage, nextQuery, nextSort, formId);
      const cached = cacheRef.current.get(key);
      if (cached) {
        setRows(cached.rows);
        setTotal(cached.total);
        setPage(nextPage);
        scrollToPageTop();
        return;
      }

      startLoad(async () => {
        const result = await fetchResponsesPageAction({
          page: nextPage,
          query: nextQuery || undefined,
          formId,
          sort: nextSort,
        });
        if ("error" in result) return;
        cacheRef.current.set(key, { rows: result.rows, total: result.total });
        setRows(result.rows);
        setTotal(result.total);
        setPage(result.page);
        scrollToPageTop();
      });
    },
    [formId]
  );

  useEffect(() => {
    const prev = filtersRef.current;
    const filtersChanged =
      prev.debouncedQuery !== debouncedQuery ||
      prev.sort !== sort ||
      prev.formId !== formId;

    filtersRef.current = { debouncedQuery, sort, formId };

    if (!filtersChanged) return;

    const usesInitialData =
      debouncedQuery === "" &&
      effectiveSort === "newest" &&
      !formId &&
      initialPage.page === 1;

    if (usesInitialData) {
      setRows(initialPage.rows);
      setTotal(initialPage.total);
      setPage(1);
      cacheRef.current.set(cacheKey(1, "", "newest", formId), {
        rows: initialPage.rows,
        total: initialPage.total,
      });
      return;
    }

    cacheRef.current.clear();
    loadPage(1, debouncedQuery, effectiveSort);
  }, [debouncedQuery, sort, effectiveSort, formId, loadPage, initialPage]);

  const pageCount = Math.max(1, Math.ceil(total / RESPONSE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * RESPONSE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * RESPONSE_PAGE_SIZE, total);

  const visibleRows = useMemo(
    () =>
      debouncedQuery
        ? rows.filter((row) => matchesResponseCardSearch(debouncedQuery, row))
        : rows,
    [rows, debouncedQuery]
  );

  function goToPage(nextPage: number) {
    if (nextPage === currentPage) return;
    loadPage(nextPage, debouncedQuery, effectiveSort);
  }

  return (
    <section>
      <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Responses</h1>
            {formTitle ? (
              <p className="mt-1 text-sm text-muted">
                Showing submissions for {formTitle}.{" "}
                <Link
                  href="/dashboard/responses"
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  View all
                </Link>
              </p>
            ) : null}
          </div>
          <DirectoryToolbar
            query={query}
            onQueryChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            view={view}
            onViewChange={setView}
            searchPlaceholder="Search responses..."
            className="w-full"
            sort={sort}
            onSortChange={(next: DirectorySort) => {
              setSort(next);
              setPage(1);
            }}
          />
        </div>

        {total === 0 && !loading ? (
          <p className="mt-6 app-radius border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
            {debouncedQuery
              ? "No responses match this search."
              : "No responses yet. Publish a form and share the client link to collect feedback."}
          </p>
        ) : (
          <div className="relative mt-6 min-h-[12rem]">
            {loading ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center app-radius bg-background/70"
                aria-live="polite"
                aria-busy="true"
              >
                <Spinner className="h-6 w-6 text-accent" />
              </div>
            ) : null}
            <div className={loading ? "pointer-events-none opacity-50" : undefined}>
              {view === "grid" ? (
                <ul className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleRows.map((row, index) => (
                    <li key={row.id} className="h-full">
                      <Stagger index={index}>
                        <DirectoryCard>
                          <DirectoryCardIcon>
                            <Inbox className="h-5 w-5" />
                          </DirectoryCardIcon>
                          <div className="mt-4 min-w-0 flex-1">
                            <DirectoryCardTitle title={row.formTitle}>
                              {row.formTitle}
                            </DirectoryCardTitle>
                            <dl className="mt-5 space-y-2">
                              <DirectoryCardLine
                                label="Team"
                                value={row.teamName}
                                title={row.teamName}
                              />
                              <DirectoryCardLine
                                label="Client"
                                value={row.clientName}
                                title={row.clientName}
                              />
                              <DirectoryCardLine
                                label="Submitted"
                                value={formatMonthYear(row.submittedAt)}
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
                <div className="directory-table-wrap">
                  <table className="directory-table w-full min-w-[40rem] text-sm">
                    <thead>
                      <tr>
                        <TableHeadLeft className="w-[40%]">
                          {columnLabel(total, "Form", "Forms")}
                        </TableHeadLeft>
                        <TableHeadCenter className="w-[22%]">
                          {columnLabel(total, "Team", "Teams")}
                        </TableHeadCenter>
                        <TableHeadCenter className="w-[22%]">
                          {columnLabel(total, "Client", "Clients")}
                        </TableHeadCenter>
                        <TableHeadCenter className="w-[16%]">Submitted</TableHeadCenter>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => (
                        <DirectoryTableRow
                          key={row.id}
                          href={row.href}
                          ariaLabel={`Review ${row.formTitle}`}
                        >
                          <TableCellLeft className="font-medium">{row.formTitle}</TableCellLeft>
                          <TableCellCenter className="text-muted">{row.teamName}</TableCellCenter>
                          <TableCellCenter className="text-muted">{row.clientName}</TableCellCenter>
                          <TableCellCenter className="whitespace-nowrap text-muted">
                            {formatMonthYear(row.submittedAt)}
                          </TableCellCenter>
                        </DirectoryTableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {total > 0 ? (
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={goToPage}
            total={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            pageSize={RESPONSE_PAGE_SIZE}
          />
        ) : null}
    </section>
  );
}
