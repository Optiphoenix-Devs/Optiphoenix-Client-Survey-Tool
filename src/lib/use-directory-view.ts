"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DirectoryView } from "@/components/directory/directory-toolbar";
import {
  directoryViewToParam,
  setDirectoryViewCookie,
  viewParamToDirectoryView,
} from "@/lib/directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

const MD_QUERY = "(max-width: 767px)";

function subscribeMd(callback: () => void) {
  const media = window.matchMedia(MD_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getMdSnapshot() {
  return window.matchMedia(MD_QUERY).matches;
}

function getMdServerSnapshot() {
  return false;
}

/** Prefer card grid below `md` so tables don't force sideways scrolling on phones. */
export function useDirectoryView(
  storageKey: string,
  fallback: DirectoryView = "grid"
): [DirectoryView, (next: DirectoryView) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNarrow = useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);
  const [storedView, setStoredView] = usePersistedValue(storageKey, fallback, [
    "grid",
    "table",
  ]);
  const [forceTableOnMobile, setForceTableOnMobile] = useState(false);

  const preferred = useMemo(() => {
    const fromUrl = viewParamToDirectoryView(searchParams.get("view"));
    return fromUrl ?? storedView;
  }, [searchParams, storedView]);

  const view: DirectoryView =
    isNarrow && preferred === "table" && !forceTableOnMobile ? "grid" : preferred;

  useEffect(() => {
    if (!isNarrow) setForceTableOnMobile(false);
  }, [isNarrow]);

  useEffect(() => {
    setDirectoryViewCookie(storageKey, preferred);
  }, [storageKey, preferred]);

  const setView = useCallback(
    (next: DirectoryView) => {
      if (isNarrow && next === "table") setForceTableOnMobile(true);
      if (isNarrow && next === "grid") setForceTableOnMobile(false);
      setStoredView(next);
      setDirectoryViewCookie(storageKey, next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", directoryViewToParam(next));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [isNarrow, pathname, router, searchParams, setStoredView, storageKey]
  );

  return [view, setView];
}
