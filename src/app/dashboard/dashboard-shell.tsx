"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { usePersistedValue } from "@/lib/use-persisted-value";

type DashboardShellProps = {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  teamCount: number;
  clientCount: number;
  formCount: number;
  userCount?: number;
  responseCount?: number;
  templateCount?: number;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
};

const SIDEBAR_KEY = "optiphoenix.sidebarCollapsed";

export function DashboardShell({
  name,
  email,
  role,
  avatarUrl,
  teamCount,
  clientCount,
  formCount,
  userCount = 0,
  responseCount = 0,
  templateCount = 0,
  logoutAction,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedStored, setCollapsedStored] = usePersistedValue(
    SIDEBAR_KEY,
    "0",
    ["0", "1"]
  );
  const collapsed = collapsedStored === "1";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isFormBuilder =
    /^\/dashboard\/forms\/[^/]+/.test(pathname) ||
    (pathname.includes("/forms/") && pathname.includes("/clients/"));
  const isTemplateBuilder = /^\/dashboard\/templates\/[^/]+/.test(pathname);
  const isBuilder = isFormBuilder || isTemplateBuilder;
  const isTeamIndex = pathname === "/dashboard/teams";
  const isTeamClientList = /^\/dashboard\/teams\/[^/]+$/.test(pathname);
  const isClientSection =
    pathname.startsWith("/dashboard/clients") ||
    isTeamClientList ||
    (pathname.includes("/clients/") && !isBuilder);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function toggleCollapsed() {
    setCollapsedStored(collapsed ? "0" : "1");
  }

  const nav = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/teams",
      label: "Teams",
      icon: Users,
      count: teamCount,
      active: isTeamIndex,
    },
    {
      href: "/dashboard/clients",
      label: "Clients",
      icon: Building2,
      count: clientCount,
      active: isClientSection,
    },
    {
      href: "/dashboard/forms",
      label: "Forms",
      icon: FileText,
      count: formCount,
      active: pathname === "/dashboard/forms" || isFormBuilder,
    },
    {
      href: "/dashboard/templates",
      label: "Templates",
      icon: Bookmark,
      count: templateCount,
      active: pathname.startsWith("/dashboard/templates"),
    },
    {
      href: "/dashboard/responses",
      label: "Responses",
      icon: FolderKanban,
      count: responseCount,
      active: pathname.startsWith("/dashboard/responses"),
    },
    {
      href: "/dashboard/insights",
      label: "Insights",
      icon: Sparkles,
      active: pathname.startsWith("/dashboard/insights"),
    },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/users",
            label: "Users",
            icon: UserRound,
            count: userCount,
            active: pathname.startsWith("/dashboard/users"),
          },
        ]
      : []),
  ];

  if (isBuilder) {
    return (
      <div className="app-grid flex h-dvh min-h-dvh flex-col overflow-hidden">
        <NavigationProgress />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="app-grid flex min-h-dvh">
      <NavigationProgress />
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 transition-opacity duration-300 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col overflow-hidden border-r border-border bg-card/95 px-3 py-5 backdrop-blur-sm",
          "transition-[width,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width,transform]",
          collapsed ? "w-64 lg:w-[4.75rem]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed ? "lg:flex-col lg:gap-3" : "justify-between px-1"
          )}
        >
          <Link
            href="/dashboard"
            prefetch
            className={cn(
              "flex min-w-0 items-center gap-2.5",
              collapsed && "lg:justify-center"
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-on-accent">
              OP
            </span>
            <span
              className={cn(
                "truncate text-sm font-semibold tracking-tight transition-opacity duration-300",
                collapsed && "lg:hidden"
              )}
            >
              OptiPhoenix
            </span>
          </Link>
          <Tooltip label={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="bottom">
            <button
              type="button"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-foreground lg:inline-flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronsLeft className="h-4 w-4 shrink-0" />
              )}
            </button>
          </Tooltip>
          <button
            type="button"
            className="rounded-lg p-1 text-muted lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const link = (
              <Link
                href={item.href}
                prefetch
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex h-11 w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium",
                  "transition-[background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  item.active
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-hover hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span
                  className={cn(
                    "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    collapsed ? "max-w-[10rem] opacity-100 lg:max-w-0 lg:opacity-0" : "max-w-[10rem] opacity-100"
                  )}
                >
                  {item.label}
                </span>
                {item.count != null ? (
                  <span
                    className={cn(
                      "ml-auto shrink-0 overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-[opacity,max-width] duration-300",
                      collapsed && "lg:max-w-0 lg:px-0 lg:opacity-0",
                      item.active ? "bg-on-accent/15 text-on-accent" : "bg-sage/20 text-accent"
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.href} label={item.label} className="flex w-full">
                {link}
              </Tooltip>
            ) : (
              <span key={item.href} className="block w-full">
                {link}
              </span>
            );
          })}
        </nav>

        <div className="relative border-t border-border pt-4" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl py-2 text-left transition hover:bg-hover",
              collapsed ? "justify-center px-0" : "px-2"
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage/20 text-xs font-semibold text-accent">
                {initials || "OP"}
              </span>
            )}
            <span
              className={cn(
                "min-w-0 flex-1 overflow-hidden transition-opacity duration-300",
                collapsed && "lg:hidden"
              )}
            >
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted">{email}</span>
            </span>
          </button>
          {menuOpen ? (
            <div
              className={cn(
                "absolute z-50 rounded-xl border border-border bg-card p-2 shadow-sm",
                collapsed
                  ? "bottom-0 left-full ml-2 w-56"
                  : "bottom-full left-0 right-0 mb-2"
              )}
            >
              <div className="flex items-center gap-3 px-2 py-2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sage/20 text-xs font-semibold text-accent">
                    {initials || "OP"}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
              </div>
              <ThemeToggle showLabel className="w-full justify-start px-2" />
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-hover"
              >
                <UserRound className="h-4 w-4" />
                Account
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-hover"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </aside>

      <div
        className={cn(
          "hidden shrink-0 lg:block",
          "transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed ? "w-[4.75rem]" : "w-64"
        )}
        aria-hidden
      />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-lg border border-border p-2"
            onClick={() => setMobileOpen(true)}
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
