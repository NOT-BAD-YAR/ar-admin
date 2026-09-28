import { useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { CompetencyRadar } from "../components/charts/RadarChart";
import { BarList } from "../components/charts/BarList";
import { useWorkers, useAllProgress, useAllResults } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, filterProgress, hasActiveFilters } from "../lib/filters";
import { computeStateCompetencyAverages, workerIdFromPath } from "../lib/aggregate";
import { COMPETENCY_DIMENSIONS } from "../lib/constants";

export function Competency() {
  const workers = useWorkers();
  const progress = useAllProgress();
  const results = useAllResults();
  const { filters } = useSettings();
  const [selectedWorker, setSelectedWorker] = useState("");

  const loading = workers.loading || progress.loading || results.loading;
  const error = workers.error || progress.error || results.error;

  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);
  const globallyFilteredWorkers = useMemo(
    () => filterWorkers(workers.data, filters, workerDistricts),
    [workers.data, filters, workerDistricts]
  );
  const filteredWorkerIds = useMemo(() => new Set(globallyFilteredWorkers.map((w) => w.id)), [globallyFilteredWorkers]);

  const filteredProgress = useMemo(() => {
    return filterProgress(progress.data, filters, filteredWorkerIds).filter((p) => p.competencyScores);
  }, [progress.data, filters, filteredWorkerIds]);

  const stateAverages = useMemo(() => computeStateCompetencyAverages(filteredProgress), [filteredProgress]);

  const weakestFirst = useMemo(
    () =>
      COMPETENCY_DIMENSIONS.map((d) => ({ label: d.label, value: Math.round(stateAverages[d.key] ?? 0), color: d.series }))
        .sort((a, b) => a.value - b.value),
    [stateAverages]
  );

  const workerOptions = useMemo(
    () => globallyFilteredWorkers.slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [globallyFilteredWorkers]
  );

  const workerAverages = useMemo(() => {
    if (!selectedWorker) return null;
    const rows = progress.data.filter((p) => (p.workerId ?? workerIdFromPath(p._path)) === selectedWorker && p.competencyScores);
    if (!rows.length) return null;
    return computeStateCompetencyAverages(rows);
  }, [progress.data, selectedWorker]);

  if (loading) return <LoadingState label="Aggregating competency scores…" />;
  if (error) return <ErrorState error={error} />;

  const hasData = filteredProgress.length > 0;

  return (
    <div className="page-stack">
      {hasActiveFilters(filters) && (
        <p className="filter-notice">Averages below reflect the active filters — {globallyFilteredWorkers.length} of {workers.data.length} workers included.</p>
      )}

      <div className="toolbar toolbar-card">
        <label className="select-field">
          Compare a worker vs state average
          <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
            <option value="">— none —</option>
            {workerOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name ?? w.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="two-col">
        <Card
          title={selectedWorker ? "Worker vs State Average" : "State-Wide Competency Radar"}
          subtitle={`${filteredProgress.length} module attempt${filteredProgress.length === 1 ? "" : "s"} with recorded competency scores`}
        >
          {hasData ? (
            <CompetencyRadar
              series={
                workerAverages
                  ? [
                      { label: "Selected worker", color: "var(--series-1)", values: workerAverages },
                      { label: "State average", color: "var(--series-6)", values: stateAverages },
                    ]
                  : [{ label: "State average", color: "var(--series-1)", values: stateAverages }]
              }
            />
          ) : (
            <EmptyState label="No competency scores recorded yet for this filter." />
          )}
        </Card>

        <Card title="Weakest Dimensions" subtitle="Ranked ascending — lowest score first, retraining candidates">
          {hasData ? <BarList items={weakestFirst} valueFormatter={(v) => `${v}%`} maxValue={100} /> : <EmptyState />}
        </Card>
      </div>
    </div>
  );
}
