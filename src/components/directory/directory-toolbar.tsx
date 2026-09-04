"use client";

import { LayoutGrid, Search, Table2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Select, SortByOption } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  DIRECTORY_SORT_OPTIONS,
  type DirectorySort,
  type DirectorySortSelection,
} from "@/lib/sort";

export type DirectoryView = "grid" | "table";

export function DirectoryToolbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  searchPlaceholder,
  className,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  view: DirectoryView;
  onViewChange: (view: DirectoryView) => void;
  searchPlaceholder: string;
  className?: string;
  sort?: DirectorySortSelection;
  onSortChange?: (sort: DirectorySort) => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center",
        className
      )}
    >
      <label className="relative w-full min-w-0 flex-1 lg:max-w-xs">
        <span className="sr-only">{searchPlaceholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="app-toolbar-input outline-none"
        />
      </label>
      <div className="flex w-full min-w-0 shrink-0 items-center gap-2 md:ml-auto md:w-auto">
        {sort !== undefined && onSortChange ? (
          <label className="min-w-0 flex-1 md:w-[11.5rem] md:flex-none">
            <span className="sr-only">Sort by</span>
            <Select
              value={sort}
              onChange={(event) => {
                const next = event.target.value;
                if (!next) return;
                onSortChange(next as DirectorySort);
              }}
              aria-label="Sort by"
              className="min-w-0 w-full"
            >
              <SortByOption />
              {DIRECTORY_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <div
          className="flex h-10 shrink-0 app-radius border border-border bg-surface p-1"
          role="group"
          aria-label="Layout"
        >
          <Tooltip label="Card grid" side="bottom">
            <button
              type="button"
              onClick={() => onViewChange("grid")}
              aria-pressed={view === "grid"}
              className={cn(
                "grid h-full w-9 place-items-center app-radius transition",
                view === "grid" ? "app-icon-toggle-active" : "app-icon-toggle text-muted"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Card grid</span>
            </button>
          </Tooltip>
          <Tooltip label="Table" side="bottom">
            <button
              type="button"
              onClick={() => onViewChange("table")}
              aria-pressed={view === "table"}
              className={cn(
                "grid h-full w-9 place-items-center app-radius transition",
                view === "table" ? "app-icon-toggle-active" : "app-icon-toggle text-muted"
              )}
            >
              <Table2 className="h-4 w-4" />
              <span className="sr-only">Table</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
