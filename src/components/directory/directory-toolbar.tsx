"use client";

import { LayoutGrid, Search, Table2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

export type DirectoryView = "grid" | "table";

export function DirectoryToolbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  searchPlaceholder,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  view: DirectoryView;
  onViewChange: (view: DirectoryView) => void;
  searchPlaceholder: string;
}) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
      <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
        <span className="sr-only">{searchPlaceholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </label>
      <div
        className="flex rounded-full border border-border bg-surface p-1"
        role="group"
        aria-label="Layout"
      >
        <Tooltip label="Card grid" side="bottom">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition",
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
            onClick={() => onViewChange("table")}
            aria-pressed={view === "table"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition",
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
    </div>
  );
}
