import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={cn(
          "w-full appearance-none bg-none app-radius border border-border bg-surface py-2.5 pr-11 pl-3 text-sm outline-none focus:border-accent",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
    </span>
  );
}
