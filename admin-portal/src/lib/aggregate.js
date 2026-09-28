import { daysSince, daysUntil, average, clamp } from "./format";
import { JHARKHAND_DISTRICTS, ORIENTATION_WINDOW_DAYS, COMPETENCY_DIMENSIONS } from "./constants";

export function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

/** Worker is overdue for the N-day orientation rule if tenure exceeds the window
 * with zero certificates earned — the exact rule described in the spec. `windowDays`
 * defaults to the spec's 30-day rule but is admin-adjustable via SettingsContext. */
export function isOrientationOverdue(worker, windowDays = ORIENTATION_WINDOW_DAYS) {
  const tenure = daysSince(worker.joinDate);
  return tenure !== null && tenure > windowDays && (worker.certificatesEarned ?? 0) === 0;
}

export function orientationStatus(worker, windowDays = ORIENTATION_WINDOW_DAYS) {
  const tenure = daysSince(worker.joinDate);
  if (tenure === null) return "unknown";
  if ((worker.certificatesEarned ?? 0) > 0) return "compliant";
  if (tenure > windowDays) return "overdue";
  return "within-window";
}

/** Resolve a Firestore locationName string to one of the known Jharkhand districts. */
export function matchDistrict(locationName) {
  if (!locationName) return null;
  const lower = locationName.toLowerCase();
  return JHARKHAND_DISTRICTS.find((d) => lower.includes(d.toLowerCase())) ?? null;
}

export function resultScore(result) {
  const raw = result.score ?? result.percentage;
  return typeof raw === "number" ? raw : null;
}

export function computeDistrictStats(results) {
  const withDistrict = results
    .map((r) => ({ ...r, district: matchDistrict(r.locationName) }))
    .filter((r) => r.district);

  const grouped = groupBy(withDistrict, (r) => r.district);
  return JHARKHAND_DISTRICTS.map((name) => {
    const rows = grouped.get(name) ?? [];
    const scores = rows.map(resultScore).filter((s) => s !== null);
    const avgScore = scores.length ? average(scores) : null;
    const workerIds = new Set(rows.map((r) => r.workerId).filter(Boolean));
    return {
      name,
      workerCount: workerIds.size,
      attemptCount: rows.length,
      riskScore: avgScore === null ? 0 : clamp(100 - avgScore, 0, 100),
    };
  });
}

export function computeStateCompetencyAverages(progressDocs) {
  const withScores = progressDocs.filter((p) => p.competencyScores);
  const result = {};
  for (const dim of COMPETENCY_DIMENSIONS) {
    const values = withScores.map((p) => p.competencyScores?.[dim.key]).filter((v) => typeof v === "number");
    result[dim.key] = values.length ? average(values) : 0;
  }
  return result;
}

/** Certificates expiring within `withinDays`, soonest first. Already-expired excluded. */
export function expiringSoon(certificates, withinDays = 30) {
  return certificates
    .map((c) => ({ ...c, daysLeft: daysUntil(c.expiryDate) }))
    .filter((c) => c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Hesitation vs panic classification, relative to the dataset's own median completion time
 * for that module — there's no fixed "expected time" field in the schema, so attempts are
 * judged against their peers on the same module. */
export function classifyPacing(result, peerResults) {
  const time = result.completionTimeSec;
  const mistakes = result.mistakesCount;
  if (typeof time !== "number" || typeof mistakes !== "number") return "unknown";

  const peerTimes = peerResults.map((r) => r.completionTimeSec).filter((t) => typeof t === "number").sort((a, b) => a - b);
  const peerMistakes = peerResults.map((r) => r.mistakesCount).filter((m) => typeof m === "number");
  if (!peerTimes.length) return "unknown";

  const medianTime = peerTimes[Math.floor(peerTimes.length / 2)];
  const avgMistakes = average(peerMistakes);

  if (time <= medianTime && mistakes > avgMistakes) return "panic";
  if (time > medianTime && mistakes <= avgMistakes) return "hesitation";
  return "steady";
}

/** Results with valid GPS coordinates, shaped for the map/heatmap layer. */
export function extractGeoPoints(results, workerById) {
  return results
    .filter((r) => r.hasLocation && typeof r.latitude === "number" && typeof r.longitude === "number")
    .map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      score: resultScore(r) ?? 0,
      workerId: r.workerId,
      workerName: workerById?.get(r.workerId)?.name ?? r.workerId ?? "Unknown",
      moduleId: r.moduleId ?? r.moduleName,
      district: matchDistrict(r.locationName),
      locationName: r.locationName,
      capturedOffline: !!r.capturedOffline,
      timestamp: r.timestamp,
    }));
}

export function workerIdFromPath(path) {
  const parts = path.split("/");
  const idx = parts.indexOf("workers");
  return idx >= 0 ? parts[idx + 1] : null;
}

export function moduleLabel(moduleId) {
  if (!moduleId) return "Unknown Module";
  return moduleId
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
