"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { scrollToPageTop } from "@/lib/scroll-to-page-top";

export const PAGE_SIZE = 12;

export function usePaged<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const skipScrollRef = useRef(true);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const slice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const rangeStart = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, items.length);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }

    scrollToPageTop();
  }, [currentPage]);

  return {
    page: currentPage,
    setPage,
    pageCount,
    slice,
    total: items.length,
    rangeStart,
    rangeEnd,
    pageSize,
    show: items.length > pageSize,
  };
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  rangeStart,
  rangeEnd,
  pageSize = PAGE_SIZE,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  pageSize?: number;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      className={cn(
        "mt-8 flex flex-col gap-4 app-radius border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className
      )}
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
        Showing{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="font-semibold tabular-nums text-foreground">{total}</span>
        <span className="hidden sm:inline"> · {pageSize} per page</span>
      </p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-medium tabular-nums text-foreground sm:min-w-[7rem] sm:text-center">
          Page {page} of {pageCount}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="app-btn-secondary h-10 gap-1.5 px-3 text-sm disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="app-btn-secondary h-10 gap-1.5 px-3 text-sm disabled:opacity-40"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
