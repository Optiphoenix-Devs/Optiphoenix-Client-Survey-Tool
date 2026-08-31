"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { usePersistedValue } from "@/lib/use-persisted-value";
import { AccountMenuPanel, useAccountMenuDismiss } from "./sidebar-account-menu";

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
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
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

  useAccountMenuDismiss(menuOpen, () => setMenuOpen(false), menuRef, menuPanelRef);

  function toggleCollapsed() {
    setMenuOpen(false);
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
      icon: BarChart3,
      active: pathname.startsWith("/dashboard/insights"),
    },
    {
      href: "/dashboard/summarize",
      label: "Summarize",
      icon: Sparkles,
      active: pathname.startsWith("/dashboard/summarize"),
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
        <div className="app-grid-body flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-chrome">
      <NavigationProgress />
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "app-chrome fixed inset-y-0 left-0 z-40 flex h-dvh flex-col overflow-hidden border-r border-border py-5",
          collapsed ? "px-2 lg:px-2" : "px-3",
          collapsed
            ? "w-64 shadow-[2px_0_18px_rgba(20,38,28,0.06)] lg:w-[4.75rem]"
            : "w-64 shadow-[4px_0_28px_rgba(20,38,28,0.1)]",
          mobileOpen
            ? "translate-x-0 shadow-[8px_0_36px_rgba(20,38,28,0.14)]"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed ? "justify-between px-1 lg:flex-col lg:justify-start lg:gap-3 lg:px-0" : "justify-between px-1"
          )}
        >
          <Link
            href="/dashboard"
            prefetch
            className={cn(
              "flex min-w-0 items-center gap-2.5",
              collapsed && "lg:w-full lg:justify-center lg:gap-0"
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center app-radius bg-brand text-sm font-semibold text-on-brand">
              OP
            </span>
            <span
              className={cn(
                "truncate text-sm font-semibold tracking-tight",
                collapsed && "lg:hidden"
              )}
            >
              OptiPhoenix
            </span>
          </Link>
          <Tooltip
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            side="right"
            enabled={collapsed}
          >
            <button
              type="button"
              className="hidden h-9 w-9 shrink-0 items-center justify-center app-radius text-muted transition-colors hover:bg-hover hover:text-foreground lg:inline-flex"
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

        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {nav.map((item) => (
            <Tooltip
              key={item.href}
              label={item.label}
              side="right"
              enabled={collapsed}
              className="flex w-full"
            >
              <Link
                href={item.href}
                prefetch
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex h-11 w-full min-w-0 items-center overflow-hidden app-radius text-sm font-medium transition-colors duration-150 ease-out",
                  collapsed ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-0" : "gap-3 px-3",
                  item.active
                    ? "app-brand-surface"
                    : "text-muted app-brand-hover"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span className={cn("min-w-0 truncate whitespace-nowrap", collapsed && "lg:hidden")}>
                  {item.label}
                </span>
                {item.count != null ? (
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      collapsed && "lg:hidden",
                      item.active
                        ? "bg-white/20 text-white"
                        : "bg-brand/15 text-accent group-hover:bg-white/20 group-hover:text-white"
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            </Tooltip>
          ))}
        </nav>

        <div className="relative border-t border-border pt-4" ref={menuRef}>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "flex w-full items-center app-radius py-2 text-left transition-colors hover:bg-hover",
              collapsed
                ? "gap-3 px-2 lg:h-11 lg:justify-center lg:gap-0 lg:px-0"
                : "gap-3 px-2"
            )}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage/20 text-xs font-semibold text-accent">
                {initials || "OP"}
              </span>
            )}
            <span className={cn("min-w-0 flex-1 overflow-hidden", collapsed && "lg:hidden")}>
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted">{email}</span>
            </span>
          </button>
          <AccountMenuPanel
            open={menuOpen}
            anchorRef={menuButtonRef}
            panelRef={menuPanelRef}
            name={name}
            email={email}
            avatarUrl={avatarUrl}
            initials={initials}
            onClose={() => setMenuOpen(false)}
            logoutAction={logoutAction}
          />
        </div>
      </aside>

      <div
        className={cn("hidden shrink-0 lg:block", collapsed ? "w-[4.75rem]" : "w-64")}
        aria-hidden
      />

      <div className="app-grid flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="app-chrome relative z-10 flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
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
        <div className={cn("app-grid-body min-h-0 flex-1", isBuilder ? "overflow-hidden" : "overflow-auto")}>
          {children}
        </div>
      </div>
    </div>
  );
}
