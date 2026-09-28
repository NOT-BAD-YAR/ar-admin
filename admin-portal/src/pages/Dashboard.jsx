import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, Gauge, Factory, CloudUpload, AlertTriangle, Award, ArrowUpRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { GeoMap } from "../components/charts/GeoMap";
import { useWorkers, useCertificates, useAllResults, useAllProgress } from "../hooks/useFirestoreData";
import { useSettings } from "../state/SettingsContext";
import { computeWorkerDistricts, filterWorkers, filterResults, filterProgress, filterCertificates, hasActiveFilters } from "../lib/filters";
import { isOrientationOverdue, expiringSoon, moduleLabel, groupBy, extractGeoPoints } from "../lib/aggregate";
import { average } from "../lib/format";

export function Dashboard() {
  const workers = useWorkers();
  const certificates = useCertificates();
  const results = useAllResults();
  const progress = useAllProgress();
  const { filters, thresholds } = useSettings();

  const loading = workers.loading || certificates.loading || results.loading || progress.loading;
  const error = workers.error || certificates.error || results.error || progress.error;

  const workerDistricts = useMemo(() => computeWorkerDistricts(results.data), [results.data]);

  const filteredWorkers = useMemo(
    () => filterWorkers(workers.data, filters, workerDistricts),
    [workers.data, filters, workerDistricts]
  );
  const filteredWorkerIds = useMemo(() => new Set(filteredWorkers.map((w) => w.id)), [filteredWorkers]);

  const filteredResults = useMemo(() => filterResults(results.data, filters, filteredWorkerIds), [results.data, filters, filteredWorkerIds]);
  const filteredProgress = useMemo(() => filterProgress(progress.data, filters, filteredWorkerIds), [progress.data, filters, filteredWorkerIds]);
  const filteredCerts = useMemo(() => filterCertificates(certificates.data, filters, filteredWorkerIds), [certificates.data, filters, filteredWorkerIds]);

  const workerById = useMemo(() => new Map(workers.data.map((w) => [w.id, w])), [workers.data]);
  const geoPoints = useMemo(() => extractGeoPoints(filteredResults, workerById), [filteredResults, workerById]);

  const stats = useMemo(() => {
    const totalWorkers = filteredWorkers.length;
    const certifiedWorkers = filteredWorkers.filter((w) => (w.certificatesEarned ?? 0) > 0).length;
    const complianceRate = totalWorkers ? (certifiedWorkers / totalWorkers) * 100 : 0;
    const avgBestScore = average(filteredProgress.map((p) => p.bestScore).filter((s) => typeof s === "number"));
    const auditScore = totalWorkers ? Math.round(complianceRate * 0.6 + avgBestScore * 0.4) : 0;
    const sites = new Set(filteredWorkers.map((w) => w.organization).filter(Boolean)).size;
    const offlineCaptured = filteredResults.filter((r) => r.capturedOffline).length;

    return { totalWorkers, certifiedWorkers, complianceRate, auditScore, sites, offlineCaptured };
  }, [filteredWorkers, filteredProgress, filteredResults]);

  const alerts = useMemo(() => {
    const list = [];
    const overdue = filteredWorkers.filter((w) => isOrientationOverdue(w, thresholds.orientationWindowDays));
    if (overdue.length) {
      list.push({
        tone: "critical",
        text: `${overdue.length} worker${overdue.length === 1 ? "" : "s"} past the ${thresholds.orientationWindowDays}-day orientation window with zero certificates.`,
      });
    }

    const soonExpiring = expiringSoon(filteredCerts, thresholds.certExpiryWarningDays);
    if (soonExpiring.length) {
      list.push({
        tone: "warning",
        text: `${soonExpiring.length} certificate${soonExpiring.length === 1 ? "" : "s"} expiring within ${thresholds.certExpiryWarningDays} days.`,
      });
    }

    const byModule = groupBy(filteredProgress.filter((p) => typeof p.bestScore === "number"), (p) => p.moduleId ?? "unknown");
    for (const [moduleId, rows] of byModule) {
      const avg = average(rows.map((r) => r.bestScore));
      if (rows.length >= 3 && avg < thresholds.passThreshold) {
        list.push({
          tone: "serious",
          text: `${moduleLabel(moduleId)} averaging ${Math.round(avg)}% across ${rows.length} attempts — below the ${thresholds.passThreshold}% pass bar.`,
        });
      }
    }

    return list;
  }, [filteredWorkers, filteredCerts, filteredProgress, thresholds]);

  if (loading) return <LoadingState label="Loading state-wide KPIs…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="page-stack">
      {hasActiveFilters(filters) && (
        <p className="filter-notice">Showing data narrowed by the active filters above — {stats.totalWorkers} of {workers.data.length} workers match.</p>
      )}

      <div className="stat-grid">
        <StatCard icon={Users} label="Registered Workers" value={stats.totalWorkers} sublabel={`${stats.certifiedWorkers} certified`} />
        <StatCard icon={ShieldCheck} label="Compliance Rate" value={`${Math.round(stats.complianceRate)}%`} sublabel="workers with ≥1 valid certificate" />
        <StatCard icon={Gauge} label="DGMS Audit Score" value={stats.auditScore} sublabel="compliance + competency composite" tone={stats.auditScore < 60 ? "critical" : stats.auditScore < 80 ? "warning" : "good"} />
        <StatCard icon={Factory} label="Sites Monitored" value={stats.sites} sublabel="distinct organizations" />
        <StatCard icon={CloudUpload} label="Offline-Captured Attempts" value={stats.offlineCaptured} sublabel="synced from underground/no-signal devices" />
        <StatCard icon={Award} label="Certificates Issued" value={filteredCerts.length} sublabel="public ledger records" />
      </div>

      <div className="two-col">
        <Card
          title="Location Risk Map"
          subtitle="Live heatmap of GPS-tagged assessment attempts"
          action={
            <Link to="/geo" className="btn btn-ghost">
              Full Geo Analytics <ArrowUpRight size={14} />
            </Link>
          }
        >
          {geoPoints.length ? (
            <GeoMap points={geoPoints} mode="heat" height={300} />
          ) : (
            <EmptyState label="No GPS-tagged assessment attempts yet — the map fills in as drills are captured on-site." />
          )}
        </Card>

        <Card title="Live Safety Alert Feed" subtitle="Derived from orientation, expiry & module pass-rate signals">
          {alerts.length ? (
            <ul className="alert-list">
              {alerts.map((a, i) => (
                <li key={i} className={`alert-item alert-${a.tone}`}>
                  <AlertTriangle size={16} strokeWidth={2.25} />
                  <span>{a.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState label="No active alerts — all monitored signals are within range." />
          )}
        </Card>
      </div>
    </div>
  );
}
