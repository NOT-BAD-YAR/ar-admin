import { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { useWorkers, useAllResults } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, hasActiveFilters } from "../lib/filters";
import { orientationStatus } from "../lib/aggregate";
import { daysSince, formatDate } from "../lib/format";

const STATUS_BADGE = {
  compliant: { status: "good", label: "Certified" },
  overdue: { status: "critical", label: "Orientation Overdue" },
  "within-window": { status: "pending", label: "Within Orientation Window" },
  unknown: { status: "neutral", label: "No Join Date" },
};

export function Compliance() {
  const workers = useWorkers();
  const results = useAllResults();
  const { filters, thresholds } = useSettings();
  const [search, setSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const loading = workers.loading || results.loading;
  const error = workers.error || results.error;

  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);
  const globallyFiltered = useMemo(
    () => filterWorkers(workers.data, filters, workerDistricts),
    [workers.data, filters, workerDistricts]
  );

  const rows = useMemo(() => {
    return globallyFiltered
      .map((w) => ({ ...w, tenure: daysSince(w.joinDate), status: orientationStatus(w, thresholds.orientationWindowDays) }))
      .filter((w) => {
        if (overdueOnly && w.status !== "overdue") return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (w.name ?? "").toLowerCase().includes(q) || (w.organization ?? "").toLowerCase().includes(q) || (w.sector ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => (b.tenure ?? -1) - (a.tenure ?? -1));
  }, [globallyFiltered, search, overdueOnly, thresholds.orientationWindowDays]);

  const overdueCount = useMemo(
    () => globallyFiltered.filter((w) => orientationStatus(w, thresholds.orientationWindowDays) === "overdue").length,
    [globallyFiltered, thresholds.orientationWindowDays]
  );
  const complianceRate = globallyFiltered.length ? Math.round(((globallyFiltered.length - overdueCount) / globallyFiltered.length) * 100) : 0;

  if (loading) return <LoadingState label="Loading worker orientation records…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="page-stack">
      {hasActiveFilters(filters) && (
        <p className="filter-notice">Showing {globallyFiltered.length} of {workers.data.length} workers matching the active filters above.</p>
      )}

      <Card
        title="Mines Act 1952 (Sec 28) & Factories Act 1948 Compliance Meter"
        subtitle={`Automated statutory audit — ${thresholds.orientationWindowDays}-day new-worker orientation coverage`}
        action={
          <button className="btn btn-gold" onClick={() => window.print()}>
            <Printer size={15} strokeWidth={2.25} />
            Generate Audit Report
          </button>
        }
      >
        <div className="meter-row">
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{
                width: `${complianceRate}%`,
                background: complianceRate < 60 ? "var(--status-critical)" : complianceRate < 85 ? "var(--status-warning)" : "var(--status-good)",
              }}
            />
          </div>
          <span className="meter-value mono">{complianceRate}%</span>
        </div>
        <p className="card-footnote">
          {overdueCount} of {globallyFiltered.length} matching workers exceed the {thresholds.orientationWindowDays}-day orientation window with zero certificates earned.
        </p>
      </Card>

      <Card
        title="New Worker Orientation Enforcement"
        subtitle="Tenure = today − joinDate. Flags workers who may not yet be authorized for underground shafts."
        action={
          <div className="toolbar">
            <label className="checkbox-field">
              <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
              Overdue only
            </label>
            <div className="search-field">
              <Search size={14} />
              <input placeholder="Search name, organization, sector…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        }
      >
        {rows.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Organization</th>
                  <th>Sector</th>
                  <th>Join Date</th>
                  <th>Tenure</th>
                  <th>Certificates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => {
                  const badge = STATUS_BADGE[w.status];
                  return (
                    <tr key={w.id}>
                      <td>{w.name ?? w.id}</td>
                      <td>{w.organization ?? "—"}</td>
                      <td>{w.sector ?? "—"}</td>
                      <td>{formatDate(w.joinDate)}</td>
                      <td className="mono">{w.tenure !== null ? `${w.tenure}d` : "—"}</td>
                      <td className="mono">{w.certificatesEarned ?? 0}</td>
                      <td>
                        <Badge status={badge.status}>{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No workers match this filter." />
        )}
      </Card>
    </div>
  );
}
