import { useMemo, useState } from "react";
import { Flame, MapPin } from "lucide-react";
import { Card } from "../components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { GeoMap } from "../components/charts/GeoMap";
import { DistrictHeatmap } from "../components/charts/DistrictHeatmap";
import { useWorkers, useAllResults } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, filterResults } from "../lib/filters";
import { computeDistrictStats, extractGeoPoints, moduleLabel } from "../lib/aggregate";
import { formatDate } from "../lib/format";

export function GeoAnalytics() {
  const workers = useWorkers();
  const results = useAllResults();
  const { filters } = useSettings();
  const [mode, setMode] = useState("heat");

  const loading = workers.loading || results.loading;
  const error = workers.error || results.error;

  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);

  const filteredWorkerIds = useMemo(
    () => new Set(filterWorkers(workers.data, filters, workerDistricts).map((w) => w.id)),
    [workers.data, filters, workerDistricts]
  );

  const filteredResults = useMemo(
    () => filterResults(results.data, filters, filteredWorkerIds),
    [results.data, filters, filteredWorkerIds]
  );

  const workerById = useMemo(() => new Map(workers.data.map((w) => [w.id, w])), [workers.data]);

  const geoPoints = useMemo(() => extractGeoPoints(filteredResults, workerById), [filteredResults, workerById]);

  const districtStats = useMemo(() => computeDistrictStats(filteredResults), [filteredResults]);

  const recentTagged = useMemo(
    () =>
      [...geoPoints]
        .sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0))
        .slice(0, 20),
    [geoPoints]
  );

  if (loading) return <LoadingState label="Loading GPS-tagged assessment attempts…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="page-stack">
      <Card
        title="Location-Wise Assessment Heatmap"
        subtitle={`${geoPoints.length} GPS-tagged attempt${geoPoints.length === 1 ? "" : "s"} matching current filters`}
        action={
          <div className="segmented-control">
            <button className={mode === "heat" ? "active" : ""} onClick={() => setMode("heat")}>
              <Flame size={13} /> Heat
            </button>
            <button className={mode === "points" ? "active" : ""} onClick={() => setMode("points")}>
              <MapPin size={13} /> Points
            </button>
          </div>
        }
      >
        {geoPoints.length ? (
          <GeoMap points={geoPoints} mode={mode} height={460} />
        ) : (
          <EmptyState label="No GPS-tagged attempts match the current filters." />
        )}
      </Card>

      <div className="two-col">
        <Card title="District Risk Ranking" subtitle="Avg. assessment score inverted to a risk index (0 = safest, 100 = riskiest)">
          {districtStats.some((d) => d.attemptCount > 0) ? (
            <DistrictHeatmap districts={districtStats} />
          ) : (
            <EmptyState label="No district could be resolved from the current attempts' location names." />
          )}
        </Card>

        <Card title="Recently Captured Locations" subtitle="Most recent GPS-tagged attempts, newest first">
          {recentTagged.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Module</th>
                    <th>Score</th>
                    <th>Location</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTagged.map((p, i) => (
                    <tr key={i}>
                      <td>{p.workerName}</td>
                      <td>{moduleLabel(p.moduleId)}</td>
                      <td className="mono">{p.score}%</td>
                      <td>{p.locationName ?? p.district ?? "—"}</td>
                      <td>{formatDate(p.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </Card>
      </div>
    </div>
  );
}
