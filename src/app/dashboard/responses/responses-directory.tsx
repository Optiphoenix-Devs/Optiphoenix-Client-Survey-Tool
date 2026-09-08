"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Download, Eye, Inbox, Plus, X } from "lucide-react";
import type { ResponseListRow, ResponsesPageResult } from "@/lib/responses";
import { RESPONSE_PAGE_SIZE } from "@/lib/page-size";
import { DirectoryToolbar } from "@/components/directory/directory-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/pending-button";
import { Stagger } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
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
  DIRECTORY_SORT_PLACEHOLDER,
  DIRECTORY_SORT_SELECTION_VALUES,
  resolveDirectorySort,
  type DirectorySort,
} from "@/lib/sort";
import { useDirectoryView } from "@/lib/use-directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { scrollToPageTop } from "@/lib/scroll-to-page-top";
import { fetchResponsesPageAction, exportResponsesAction } from "./actions";
import { exportAsCsv, exportAsXlsx, exportAsPdf, type ExportFormat } from "@/lib/export-responses";
import { matchesResponseCardSearch } from "@/lib/directory-search";
import { cn } from "@/lib/cn";

const VIEW_KEY = "optiphoenix.responsesView";
const SORT_KEY = "optiphoenix.responsesSort.v3";

type CacheEntry = { rows: ResponseListRow[]; total: number };

export type ClientOption = {
  id: string;
  name: string;
  email: string | null;
};

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
  clients = [],
}: {
  initialPage: ResponsesPageResult;
  formId?: string;
  formTitle?: string;
  clients?: ClientOption[];
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialPage.total);
  const [rows, setRows] = useState(initialPage.rows);
  const [view, setView] = useDirectoryView(VIEW_KEY);
  const [sort, setSort] = usePersistedValue(
    SORT_KEY,
    DIRECTORY_SORT_PLACEHOLDER,
    DIRECTORY_SORT_SELECTION_VALUES
  );
  const effectiveSort = resolveDirectorySort(sort);
  const cacheRef = useRef(new Map<string, CacheEntry>());
  const [loading, startLoad] = useTransition();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("all");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const filtersRef = useRef({
    debouncedQuery: "",
    sort: DIRECTORY_SORT_PLACEHOLDER as (typeof DIRECTORY_SORT_SELECTION_VALUES)[number],
    formId,
  });

  async function handleExport() {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    try {
      const result = await exportResponsesAction({
        clientId: selectedClientId,
        formId,
      });
      if ("error" in result) {
        setExportError(result.error);
      } else {
        if (exportFormat === "csv") {
          exportAsCsv(result);
        } else if (exportFormat === "xlsx") {
          exportAsXlsx(result);
        } else if (exportFormat === "pdf") {
          exportAsPdf(result);
        }
        setExportSuccess(true);
      }
    } catch {
      setExportError("Failed to export responses.");
    } finally {
      setIsExporting(false);
    }
  }

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
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="app-btn-secondary h-10 px-4 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
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

      <Modal
        open={exportModalOpen}
        onClose={() => {
          if (!isExporting) setExportModalOpen(false);
        }}
        labelledBy="export-modal-title"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center app-radius border border-border bg-surface text-foreground">
                <Download className="h-4 w-4" />
              </div>
              <h2 id="export-modal-title" className="text-lg font-semibold tracking-tight">
                Export Responses
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="grid h-8 w-8 place-items-center app-radius text-muted transition hover:bg-hover hover:text-foreground"
              aria-label="Close export modal"
              disabled={isExporting}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-muted">
            Select a client to filter the response spreadsheet export, or choose all clients to export full submission data.
          </p>

          {exportError ? (
            <p className="app-radius border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {exportError}
            </p>
          ) : null}

          {exportSuccess ? (
            <p className="app-radius border border-sage/40 bg-sage/10 px-3 py-2 text-xs font-medium text-sage">
              Export downloaded successfully!
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="export-client-select" className="text-sm font-medium text-foreground">
              Select Client
            </label>
            <Select
              id="export-client-select"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full min-w-0"
              disabled={isExporting}
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat("csv")}
                disabled={isExporting}
                className={cn(
                  "flex flex-col items-center justify-center p-3 app-radius border text-xs transition cursor-pointer",
                  exportFormat === "csv"
                    ? "border-brand bg-brand/10 font-semibold text-brand"
                    : "border-border bg-surface text-muted hover:text-foreground"
                )}
              >
                <span className="text-xs font-bold uppercase tracking-wider">CSV</span>
                <span className="mt-0.5 text-[10px] opacity-75">Comma Separated</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("xlsx")}
                disabled={isExporting}
                className={cn(
                  "flex flex-col items-center justify-center p-3 app-radius border text-xs transition cursor-pointer",
                  exportFormat === "xlsx"
                    ? "border-brand bg-brand/10 font-semibold text-brand"
                    : "border-border bg-surface text-muted hover:text-foreground"
                )}
              >
                <span className="text-xs font-bold uppercase tracking-wider">XLSX</span>
                <span className="mt-0.5 text-[10px] opacity-75">Excel Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("pdf")}
                disabled={isExporting}
                className={cn(
                  "flex flex-col items-center justify-center p-3 app-radius border text-xs transition cursor-pointer",
                  exportFormat === "pdf"
                    ? "border-brand bg-brand/10 font-semibold text-brand"
                    : "border-border bg-surface text-muted hover:text-foreground"
                )}
              >
                <span className="text-xs font-bold uppercase tracking-wider">PDF</span>
                <span className="mt-0.5 text-[10px] opacity-75">Printable Report</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-6">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="app-btn-secondary h-10 px-4 text-sm font-medium"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="app-btn-primary h-10 px-4 text-sm font-medium"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-on-brand" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}


