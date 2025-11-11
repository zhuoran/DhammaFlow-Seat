"use client";

import { createContext, useContext, useMemo } from "react";
import type { Center, Session } from "@/types/domain";
import { useLocalStorageState } from "@/hooks/use-local-storage";

interface AppContextValue {
  currentCenter: Center | null;
  setCenter: (center: Center | null) => void;
  currentSession: Session | null;
  setSession: (session: Session | null) => void;
  hydrated: boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const CENTER_KEY = "currentCenter";
const SESSION_KEY = "currentSession";

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [currentCenter, setCenter, centerHydrated] = useLocalStorageState<Center>(CENTER_KEY, null);
  const [currentSession, setSession, sessionHydrated] = useLocalStorageState<Session>(SESSION_KEY, null);
  const hydrated = centerHydrated && sessionHydrated;

  const value = useMemo<AppContextValue>(
    () => ({
      currentCenter,
      setCenter,
      currentSession,
      setSession,
      hydrated,
    }),
    [currentCenter, currentSession, setCenter, setSession, hydrated],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return ctx;
}
