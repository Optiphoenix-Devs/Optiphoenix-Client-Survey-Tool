"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DirectoryView } from "@/components/directory/directory-toolbar";
import {
  directoryViewToParam,
  viewParamToDirectoryView,
} from "@/lib/directory-view";
import { usePersistedValue } from "@/lib/use-persisted-value";

export function useDirectoryView(
  storageKey: string,
  fallback: DirectoryView = "grid"
): [DirectoryView, (next: DirectoryView) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedView, setStoredView] = usePersistedValue(storageKey, fallback, [
    "grid",
    "table",
  ]);

  const view = useMemo(() => {
    const fromUrl = viewParamToDirectoryView(searchParams.get("view"));
    return fromUrl ?? storedView;
  }, [searchParams, storedView]);

  const setView = useCallback(
    (next: DirectoryView) => {
      setStoredView(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", directoryViewToParam(next));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, setStoredView]
  );

  return [view, setView];
}
