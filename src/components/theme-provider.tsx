"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState, useSyncExternalStore } from "react";

/** Device-local theme only (`localStorage` key `optiphoenix.theme`). Never persisted to the database. */
type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

const listeners = new Set<() => void>();
let cachedTheme: Theme = "light";

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem("optiphoenix.theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Apply before paint — no inline <script> (React 19 forbids those in components).
  // Keep the first client snapshot equal to the server ("light") until this runs,
  // otherwise soft navigations reuse a hydrated module cache and mismatch SSR HTML.
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    cachedTheme = readStoredTheme();
    applyTheme(cachedTheme);
    setReady(true);
    emit();
  }, []);

  const theme = useSyncExternalStore<Theme>(
    subscribe,
    () => (ready ? cachedTheme : "light"),
    (): Theme => "light"
  );

  const toggleTheme = useCallback(() => {
    const next: Theme = readStoredTheme() === "dark" ? "light" : "dark";
    cachedTheme = next;
    try {
      window.localStorage.setItem("optiphoenix.theme", next);
    } catch {
      // ignore
    }
    applyTheme(next);
    emit();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
