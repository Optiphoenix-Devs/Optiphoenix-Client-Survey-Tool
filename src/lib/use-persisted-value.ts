"use client";

import { useCallback, useSyncExternalStore } from "react";

const memory = new Map<string, string | null>();
const listeners = new Map<string, Set<() => void>>();

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

function read(key: string) {
  if (typeof window === "undefined") return null;
  if (!memory.has(key)) {
    memory.set(key, window.localStorage.getItem(key));
  }
  return memory.get(key) ?? null;
}

export function usePersistedValue<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[]
): [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribeToKey(key),
    () => read(key),
    () => null
  );
  const value =
    raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      memory.set(key, next);
      window.localStorage.setItem(key, next);
      emit(key);
    },
    [key]
  );

  return [value, setValue];
}
