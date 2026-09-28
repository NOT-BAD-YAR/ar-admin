import { useMemo, useState } from "react";
import { Search, X, MapPin, WifiOff } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { Sparkline } from "../components/charts/Sparkline";
import { useAllResults, useWorkers } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, filterResults, hasActiveFilters } from "../lib/filters";
import { classifyPacing, resultScore, moduleLabel, groupBy } from "../lib/aggregate";
import { formatDate } from "../lib/format";

const PACING_BADGE = {
  panic: { status: "critical", label: "Panic / Rushing" },
  hesitation: { status: "warning", label: "Hesitation" },
  steady: { status: "good", label: "Steady" },
  unknown: { status: "neutral", label: "Insufficient Data" },
};

function timestampMs(result) {
  const t = result.timestamp;
  if (!t) return 0;
  if (typeof t === "object" && typeof t.toMillis === "function") return t.toMillis();
  return new Date(t).getTime() || 0;
}

function scoreBadge(score, thresholds) {
  if (score === null) return { status: "neutral", label: "—" };
  if (score >= thresholds.certificateThreshold) return { status: "good", label: `${score}%` };
  if (score >= thresholds.passThreshold) return { status: "warning", label: `${score}%` };
  return { status: "critical", label: `${score}%` };
}

export function AttemptInspector() {
  const results = useAllResults();
  const workers = useWorkers();
  const { filters, thresholds } = useSettings();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const loading = results.loading || workers.loading;
  const error = results.error || workers.error;

  const workerById = useMemo(() => new Map(workers.data.map((w) => [w.id, w])), [workers.data]);
  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);

  const filteredWorkerIds = useMemo(
    () => new Set(filterWorkers(workers.data, filters, workerDistricts).map((w) => w.id)),
    [workers.data, filters, workerDistricts]
  );
  const globallyFilteredResults = useMemo(
    () => filterResults(results.data, filters, filteredWorkerIds),
    [results.data, filters, filteredWorkerIds]
  );

  const byModule = useMemo(() => groupBy(globallyFilteredResults, (r) => r.moduleId ?? r.moduleName ?? "unknown"), [globallyFilteredResults]);

  const rows = useMemo(() => {
    return globallyFilteredResults
      .map((r) => {
        const peers = byModule.get(r.moduleId ?? r.moduleName ?? "unknown") ?? [];
        const worker = workerById.get(r.workerId);
        return {
          ...r,
          workerName: worker?.name ?? r.workerId ?? "Unknown",
          score: resultScore(r),
          pacing: classifyPacing(r, peers),
          ts: timestampMs(r),
        };
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.workerName.toLowerCase().includes(q) || moduleLabel(r.moduleId ?? r.moduleName).toLowerCase().includes(q);
      })
      .sort((a, b) => b.ts - a.ts);
  }, [globallyFilteredResults, byModule, workerById, search]);

  const workerCurve = useMemo(() => {
    if (!selected) return [];
    return results.data
      .filter((r) => r.workerId === selected.workerId && (r.moduleId ?? r.moduleName) === (selected.moduleId ?? selected.moduleName))
      .map((r) => ({ value: resultScore(r) ?? 0, ts: timestampMs(r) }))
      .sort((a, b) => a.ts - b.ts)
      .map((r, i) => ({ label: `#${i + 1}`, value: Math.round(r.value) }));
  }, [results.data, selected]);

  if (loading) return <LoadingState label="Loading attempt telemetry…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="page-stack">
      {hasActiveFilters(filters) && (
        <p className="filter-notice">{rows.length} of {results.data.length} attempts match the active filters above.</p>
      )}

      <Card
        title="Attempt History"
        subtitle={`${rows.length} recorded AR drill attempts, most recent first`}
        action={
          <div className="search-field">
            <Search size={14} />
            <input placeholder="Search worker or module…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table data-table-clickable">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Module</th>
                  <th>Score</th>
                  <th>Mistakes</th>
                  <th>Time</th>
                  <th>Pacing</th>
                  <th>Location</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pacingBadge = PACING_BADGE[r.pacing];
                  const score = scoreBadge(r.score, thresholds);
                  return (
                    <tr key={r._path} onClick={() => setSelected(r)} className={selected?._path === r._path ? "row-active" : ""}>
                      <td>{r.workerName}</td>
                      <td>{moduleLabel(r.moduleId ?? r.moduleName)}</td>
                      <td>
                        <Badge status={score.status}>{score.label}</Badge>
                      </td>
                      <td className="mono">{r.mistakesCount ?? "—"}</td>
                      <td className="mono">{r.completionTimeSec ? `${r.completionTimeSec}s` : "—"}</td>
                      <td>
                        <Badge status={pacingBadge.status}>{pacingBadge.label}</Badge>
                      </td>
                      <td>
                        {r.hasLocation ? (
                          <span className="inline-tag">
                            <MapPin size={12} /> {r.locationName ?? "Tagged"}
                          </span>
                        ) : (
                          "—"
                        )}
                        {r.capturedOffline && (
                          <span className="inline-tag inline-tag-muted">
                            <WifiOff size={12} /> offline
                          </span>
                        )}
                      </td>
                      <td>{formatDate(r.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No assessment attempts match the current filters." />
        )}
      </Card>

      {selected && (
        <Card
          title={`Attempt Detail — ${selected.workerName}`}
          subtitle={moduleLabel(selected.moduleId ?? selected.moduleName)}
          action={
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>
              <X size={15} /> Close
            </button>
          }
        >
          <div className="detail-grid">
            <div>
              <h4 className="detail-heading">Improvement Curve</h4>
              <Sparkline points={workerCurve} />
            </div>
            <div>
              <h4 className="detail-heading">Step-by-Step Metrics</h4>
              {Array.isArray(selected.stepMetrics) && selected.stepMetrics.length ? (
                <ol className="step-list">
                  {selected.stepMetrics.map((step, i) => (
                    <li key={i} className="step-item">
                      <span className="step-index mono">{i + 1}</span>
                      <span className="step-body">
                        {typeof step === "object" ? (
                          Object.entries(step).map(([k, v]) => (
                            <span key={k} className="step-field">
                              <b>{k}:</b> {String(v)}
                            </span>
                          ))
                        ) : (
                          String(step)
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState label="No step-level telemetry recorded for this attempt." />
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
