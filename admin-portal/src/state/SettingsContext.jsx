import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ORIENTATION_WINDOW_DAYS,
  PASS_THRESHOLD,
  CERTIFICATE_THRESHOLD,
  CERTIFICATE_EXPIRY_WARNING_DAYS,
} from "../lib/constants";

const STORAGE_KEY = "dgms-admin-settings-v1";

export const DEFAULT_FILTERS = {
  organization: "all",
  district: "all",
  language: "all",
  moduleId: "all",
  dateFrom: "",
  dateTo: "",
};

export const DEFAULT_THRESHOLDS = {
  orientationWindowDays: ORIENTATION_WINDOW_DAYS,
  passThreshold: PASS_THRESHOLD,
  certificateThreshold: CERTIFICATE_THRESHOLD,
  certExpiryWarningDays: CERTIFICATE_EXPIRY_WARNING_DAYS,
};

const SettingsContext = createContext(null);

function loadInitial() {
  if (typeof window === "undefined") {
    return { filters: DEFAULT_FILTERS, thresholds: DEFAULT_THRESHOLDS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { filters: DEFAULT_FILTERS, thresholds: DEFAULT_THRESHOLDS };
    const parsed = JSON.parse(raw);
    return {
      filters: { ...DEFAULT_FILTERS, ...(parsed.filters ?? {}) },
      thresholds: { ...DEFAULT_THRESHOLDS, ...(parsed.thresholds ?? {}) },
    };
  } catch {
    return { filters: DEFAULT_FILTERS, thresholds: DEFAULT_THRESHOLDS };
  }
}

export function SettingsProvider({ children }) {
  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private browsing / storage disabled — settings just won't persist across reloads */
    }
  }, [state]);

  const value = useMemo(
    () => ({
      filters: state.filters,
      thresholds: state.thresholds,
      setFilters: (patch) => setState((s) => ({ ...s, filters: { ...s.filters, ...patch } })),
      resetFilters: () => setState((s) => ({ ...s, filters: DEFAULT_FILTERS })),
      setThresholds: (patch) => setState((s) => ({ ...s, thresholds: { ...s.thresholds, ...patch } })),
      resetThresholds: () => setState((s) => ({ ...s, thresholds: DEFAULT_THRESHOLDS })),
    }),
    [state]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
