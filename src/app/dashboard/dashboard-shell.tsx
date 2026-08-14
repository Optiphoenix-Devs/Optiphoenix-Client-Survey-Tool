"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

type DashboardShellProps = {
  name: string;
  role: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
};

const NAV = [
  { href: "/dashboard", label: "Teams", icon: LayoutDashboard, exact: true },
];

export function DashboardShell({
  name,
  role,
  logoutAction,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isBuilder = pathname.includes("/forms/");

  if (isBuilder) {
    return <div className="min-h-full bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-full bg-background">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card px-4 py-6 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-sm font-semibold text-on-accent">
              OP
            </span>
            <span className="text-sm font-semibold tracking-tight">
              OptiPhoenix
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1 text-muted lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-stone-100 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <p className="mt-6 px-3 text-[11px] font-semibold uppercase tracking-wide text-sage">
            Later
          </p>
          <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted/70">
            <Sparkles className="h-4 w-4" />
            Insights
          </span>
          <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted/70">
            <FolderKanban className="h-4 w-4" />
            Responses
          </span>
        </nav>

        <div className="border-t border-border pt-4">
          <p className="px-3 text-sm font-medium">{name}</p>
          <p className="px-3 text-xs text-muted">
            {role === "ADMIN" ? "Admin" : "Team Lead"}
          </p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-stone-100 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-lg border border-border p-2"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold">OptiPhoenix</p>
        </header>
        <div className={cn("min-h-0 flex-1", isBuilder ? "overflow-hidden" : "overflow-auto")}>
          {children}
        </div>
      </div>
    </div>
  );
}
