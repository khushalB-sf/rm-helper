"use client";

import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Reads the theme applied by the no-flash script in the root layout (see THEME_INIT_SCRIPT). */
export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setDark(next: boolean) {
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    listeners.forEach((listener) => listener());
  }

  return { isDark, toggleTheme: () => setDark(!isDark) };
}

/** Runs before hydration (see app/layout.tsx) so the correct theme applies before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
