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

export function readStoredDirectoryView(
  storageKey: string,
  fallback: DirectoryView = "grid"
): DirectoryView {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "table" || stored === "grid") return stored;
  return fallback;
}

export function resolveDirectoryView(
  param: string | null,
  storageKey: string,
  fallback: DirectoryView = "grid"
): DirectoryView {
  return viewParamToDirectoryView(param) ?? readStoredDirectoryView(storageKey, fallback);
}
