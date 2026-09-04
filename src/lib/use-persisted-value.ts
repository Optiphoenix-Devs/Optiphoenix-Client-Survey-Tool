"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const memory = new Map<string, string | null>();
const listeners = new Map<string, Set<() => void>>();
const hydratedKeys = new Set<string>();

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribeToKey(key: string) {
  return (onStoreChange: () => void) => {
    let bucket = listeners.get(key);
    if (!bucket) {
      bucket = new Set();
      listeners.set(key, bucket);
    }
    bucket.add(onStoreChange);
    return () => {
      bucket?.delete(onStoreChange);
    };
  };
}

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getSnapshot(key: string): string | null {
  if (!hydratedKeys.has(key)) {
    return memory.has(key) ? (memory.get(key) ?? null) : null;
  }
  if (!memory.has(key)) {
    memory.set(key, readStored(key));
  }
  return memory.get(key) ?? null;
}

export function usePersistedValue<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[]
): [T, (next: T) => void] {
  useEffect(() => {
    if (hydratedKeys.has(key)) return;
    hydratedKeys.add(key);
    memory.set(key, readStored(key));
    emit(key);
  }, [key]);

  const raw = useSyncExternalStore(
    subscribeToKey(key),
    () => getSnapshot(key),
    () => null
  );

  const value =
    raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      hydratedKeys.add(key);
      memory.set(key, next);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, next);
        } catch {
          // ignore quota / privacy mode
        }
      }
      emit(key);
    },
    [key]
  );

  return [value, setValue];
}
