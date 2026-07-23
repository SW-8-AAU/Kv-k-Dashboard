"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, getToken } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

interface StatsContextValue {
  stats: StatsResponse | null;
  /** Refetch /dashboard/stats. Deduped: concurrent callers share one request. */
  refreshStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue>({
  stats: null,
  refreshStats: async () => {},
});

export function useStats() {
  return useContext(StatsContext);
}

/** Fetches /dashboard/stats once per explicit refresh and shares the result
 *  app-wide (sidebar badges, queue bucket counts). Pages call refreshStats()
 *  on mount and after every mutation so counts stay live. */
export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const refreshStats = useCallback(() => {
    if (!getToken()) return Promise.resolve();
    if (inFlight.current) return inFlight.current;
    const p = api
      .stats()
      .then(setStats)
      .catch(() => {
        // Stats are decorative; page-level fetches surface real errors.
      })
      .finally(() => {
        inFlight.current = null;
      });
    inFlight.current = p;
    return p;
  }, []);

  const value = useMemo(
    () => ({ stats, refreshStats }),
    [stats, refreshStats],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}
