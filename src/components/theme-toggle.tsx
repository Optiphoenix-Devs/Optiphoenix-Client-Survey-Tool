"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  const button = (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 text-sm transition",
        showLabel
          ? "app-menu-item w-full justify-start px-2 py-2"
          : "rounded-lg px-2 py-2 text-muted hover:bg-hover hover:text-foreground",
        className
      )}
      aria-label={label}
      suppressHydrationWarning
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center" suppressHydrationWarning>
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </span>
      {showLabel ? (dark ? "Light mode" : "Dark mode") : null}
    </button>
  );

  if (showLabel) return button;

  return (
    <Tooltip label={label} side="bottom">
      {button}
    </Tooltip>
  );
}
