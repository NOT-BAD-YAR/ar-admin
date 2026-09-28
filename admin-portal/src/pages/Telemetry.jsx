import { useMemo } from "react";
import { CloudUpload, Wifi, WifiOff } from "lucide-react";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { BarList } from "../components/charts/BarList";
import { useWorkers, useAllResults } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, filterResults, hasActiveFilters } from "../lib/filters";
import { moduleLabel } from "../lib/aggregate";
import { formatDate } from "../lib/format";
import { LANGUAGES } from "../lib/constants";

const LANGUAGE_COLOR = {
  English: "var(--series-1)",
  Hindi: "var(--series-2)",
  Santali: "var(--series-3)",
  Tamil: "var(--series-4)",
};

export function Telemetry() {
  const workers = useWorkers();
  const results = useAllResults();
  const { filters } = useSettings();

  const loading = workers.loading || results.loading;
  const error = workers.error || results.error;

  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);
  const filteredWorkers = useMemo(
    () => filterWorkers(workers.data, filters, workerDistricts),
    [workers.data, filters, workerDistricts]
  );
  const filteredWorkerIds = useMemo(() => new Set(filteredWorkers.map((w) => w.id)), [filteredWorkers]);
  const filteredResults = useMemo(
    () => filterResults(results.data, filters, filteredWorkerIds),
    [results.data, filters, filteredWorkerIds]
  );

  const languageBreakdown = useMemo(() => {
    const counts = new Map(LANGUAGES.map((l) => [l, 0]));
    for (const w of filteredWorkers) {
      const lang = w.language ?? "English";
      counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value, color: LANGUAGE_COLOR[label] ?? "var(--series-8)" }))
      .sort((a, b) => b.value - a.value);
  }, [filteredWorkers]);

  const offlineStats = useMemo(() => {
    const total = filteredResults.length;
    const offline = filteredResults.filter((r) => r.capturedOffline).length;
    return { total, offline, online: total - offline, pct: total ? Math.round((offline / total) * 100) : 0 };
  }, [filteredResults]);

  const recentOffline = useMemo(
    () =>
      filteredResults
        .filter((r) => r.capturedOffline)
        .sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0))
        .slice(0, 25),
    [filteredResults]
  );

  if (loading) return <LoadingState label="Loading language & telemetry data…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="page-stack">
      {hasActiveFilters(filters) && (
        <p className="filter-notice">Showing {filteredWorkers.length} of {workers.data.length} workers matching the active filters above.</p>
      )}

      <div className="stat-grid">
        <StatCard icon={CloudUpload} label="Total Synced Attempts" value={offlineStats.total} />
        <StatCard icon={WifiOff} label="Captured Offline" value={offlineStats.offline} sublabel={`${offlineStats.pct}% of all attempts`} tone="warning" />
        <StatCard icon={Wifi} label="Captured Online" value={offlineStats.online} tone="good" />
      </div>

      <div className="two-col">
        <Card title="Multilingual Training Adoption" subtitle="Worker language preference across sectors">
          {filteredWorkers.length ? <BarList items={languageBreakdown} /> : <EmptyState />}
        </Card>

        <Card title="Offline-Captured Attempts" subtitle="Assessments completed underground / with no signal, now synced">
          {recentOffline.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Module</th>
                    <th>Location</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOffline.map((r) => (
                    <tr key={r._path}>
                      <td>{r.workerId ?? "—"}</td>
                      <td>{moduleLabel(r.moduleId ?? r.moduleName)}</td>
                      <td>{r.locationName ?? (r.hasLocation ? "GPS tagged" : "—")}</td>
                      <td>{formatDate(r.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState label="No offline-captured attempts synced yet." />
          )}
        </Card>
      </div>
    </div>
  );
}
