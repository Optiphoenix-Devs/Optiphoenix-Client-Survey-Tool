"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

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
let themeHydrated = false;
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

function getThemeSnapshot(): Theme {
  if (!themeHydrated) return "light";
  return cachedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (themeHydrated) return;
    themeHydrated = true;
    cachedTheme = readStoredTheme();
    applyTheme(cachedTheme);
    emit();
  }, []);

  const theme = useSyncExternalStore<Theme>(
    subscribe,
    getThemeSnapshot,
    (): Theme => "light"
  );

  const toggleTheme = useCallback(() => {
    const next: Theme = readStoredTheme() === "dark" ? "light" : "dark";
    themeHydrated = true;
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
