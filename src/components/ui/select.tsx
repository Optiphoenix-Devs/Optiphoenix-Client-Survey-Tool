import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";
import { DIRECTORY_SORT_PLACEHOLDER } from "@/lib/sort";

export const CHOOSE_FIELD_PLACEHOLDER = "choose-field" as const;
export const CHOOSE_CLIENT_PLACEHOLDER = "choose-client" as const;

/** Disabled placeholder option. Shown when the select value matches. */
export function SelectPlaceholderOption({
  label,
  value = "",
}: {
  label: string;
  value?: string;
}) {
  return (
    <option value={value} disabled>
      {label}
    </option>
  );
}

export function SortByOption() {
  return (
    <SelectPlaceholderOption
      label="Sort by"
      value={DIRECTORY_SORT_PLACEHOLDER}
    />
  );
}

export function ChooseFieldOption() {
  return (
    <SelectPlaceholderOption
      label="Choose field"
      value={CHOOSE_FIELD_PLACEHOLDER}
    />
  );
}

export function ChooseClientOption() {
  return (
    <SelectPlaceholderOption
      label="Choose client"
      value={CHOOSE_CLIENT_PLACEHOLDER}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  const hasWidth = Boolean(className && /\bw-/.test(className));
  const compact = Boolean(className && /\bh-8\b/.test(className));
  return (
    <span
      className={cn(
        "relative block min-w-0",
        !hasWidth && "w-full",
        className
      )}
    >
      <select
        {...props}
        className={cn(
          "h-full w-full appearance-none bg-none app-radius border border-border bg-surface outline-none focus:border-accent disabled:opacity-60",
          compact
            ? "py-1.5 pl-2.5 pr-7 text-xs leading-none"
            : "py-2.5 pl-3 pr-11 text-sm"
        )}
      >
        {children}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
          compact ? "right-2 h-3.5 w-3.5" : "right-3.5 h-4 w-4"
        )}
        aria-hidden
      />
    </span>
  );
}
