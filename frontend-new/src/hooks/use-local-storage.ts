"use client";

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, defaultValue: T | null = null) {
  const [value, setValue] = useState<T | null>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw ? (JSON.parse(raw) as T) : defaultValue);
    } catch {
      setValue(defaultValue);
    } finally {
      setHydrated(true);
    }
  }, [defaultValue, key]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // ignore
    }
  }, [hydrated, key, value]);

  return [value, setValue, hydrated] as const;
}
