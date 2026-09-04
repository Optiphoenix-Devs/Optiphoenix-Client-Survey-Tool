import type { DirectoryView } from "@/components/directory/directory-toolbar";

export type DirectoryViewParam = "card" | "table";

export function viewParamToDirectoryView(param: string | null): DirectoryView | null {
  if (param === "card" || param === "grid") return "grid";
  if (param === "table") return "table";
  return null;
}

export function directoryViewToParam(view: DirectoryView): DirectoryViewParam {
  return view === "grid" ? "card" : "table";
}

export function directoryViewCookieName(storageKey: string) {
  return `op.${storageKey.replace(/^optiphoenix\./, "")}`;
}

export function parseDirectoryView(
  value: string | null | undefined,
  fallback: DirectoryView = "grid"
): DirectoryView {
  if (value === "table" || value === "grid") return value;
  return fallback;
}

export function readStoredDirectoryView(
  storageKey: string,
  fallback: DirectoryView = "grid"
): DirectoryView {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return parseDirectoryView(stored, fallback);
}

export function setDirectoryViewCookie(storageKey: string, view: DirectoryView) {
  if (typeof document === "undefined") return;
  document.cookie = `${directoryViewCookieName(storageKey)}=${view}; path=/; max-age=31536000; SameSite=Lax`;
}

export function resolveDirectoryView(
  param: string | null,
  storageKey: string,
  fallback: DirectoryView = "grid"
): DirectoryView {
  return viewParamToDirectoryView(param) ?? readStoredDirectoryView(storageKey, fallback);
}

export function directoryViewCookieKeyForPath(pathname: string): string | null {
  if (pathname === "/dashboard/teams") return directoryViewCookieName("optiphoenix.teamsView");
  if (pathname === "/dashboard/clients") {
    return directoryViewCookieName("optiphoenix.clientsView");
  }
  if (/^\/dashboard\/teams\/[^/]+$/.test(pathname)) {
    return directoryViewCookieName("optiphoenix.clientsView");
  }
  if (pathname === "/dashboard/forms") return directoryViewCookieName("optiphoenix.formsView");
  if (pathname === "/dashboard/templates") {
    return directoryViewCookieName("optiphoenix.templatesView");
  }
  if (pathname === "/dashboard/responses") {
    return directoryViewCookieName("optiphoenix.responsesView");
  }
  if (
    /^\/dashboard\/teams\/[^/]+\/clients\/[^/]+$/.test(pathname) &&
    !pathname.includes("/forms/")
  ) {
    return directoryViewCookieName("optiphoenix.clientFormsView");
  }
  return null;
}
