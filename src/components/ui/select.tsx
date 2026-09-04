import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

/** Disabled placeholder option (`value=""`). Shown when the select value is empty. */
export function SelectPlaceholderOption({ label }: { label: string }) {
  return (
    <option value="" disabled>
      {label}
    </option>
  );
}

export function SortByOption() {
  return <SelectPlaceholderOption label="Sort by" />;
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <span className={cn("relative block min-w-0 w-full", className)}>
      <select
        {...props}
        className="w-full appearance-none bg-none app-radius border border-border bg-surface py-2.5 pr-11 pl-3 text-sm outline-none focus:border-accent"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </span>
  );
}
