import { matchDistrict, workerIdFromPath } from "./aggregate";

/** workerId -> Set(district) derived from that worker's GPS-tagged results. */
export function computeWorkerDistricts(results) {
  const map = new Map();
  for (const r of results) {
    const d = matchDistrict(r.locationName);
    if (!d || !r.workerId) continue;
    if (!map.has(r.workerId)) map.set(r.workerId, new Set());
    map.get(r.workerId).add(d);
  }
  return map;
}

/** Distinct module ids seen across progress/results, for the filter bar's dropdown. */
export function listModuleIds(progress, results) {
  const set = new Set();
  for (const p of progress) if (p.moduleId) set.add(p.moduleId);
  for (const r of results) {
    const id = r.moduleId ?? r.moduleName;
    if (id) set.add(id);
  }
  return Array.from(set).sort();
}

function withinDateRange(dateLike, from, to) {
  if (!from && !to) return true;
  const t = new Date(dateLike).getTime();
  if (Number.isNaN(t)) return false;
  if (from && t < new Date(from).getTime()) return false;
  if (to && t > new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
  return true;
}

/** Applies organization / language / district (via a worker's tagged results) to the worker list. */
export function filterWorkers(workers, filters, workerDistricts) {
  return workers.filter((w) => {
    if (filters.organization !== "all" && w.organization !== filters.organization) return false;
    if (filters.language !== "all" && (w.language ?? "English") !== filters.language) return false;
    if (filters.district !== "all" && !workerDistricts.get(w.id)?.has(filters.district)) return false;
    return true;
  });
}

export function filterResults(results, filters, workerIdSet) {
  return results.filter((r) => {
    if (!workerIdSet.has(r.workerId)) return false;
    if (filters.moduleId !== "all" && (r.moduleId ?? r.moduleName) !== filters.moduleId) return false;
    if (!withinDateRange(r.timestamp, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function filterProgress(progress, filters, workerIdSet) {
  return progress.filter((p) => {
    const wid = p.workerId ?? workerIdFromPath(p._path);
    if (!workerIdSet.has(wid)) return false;
    if (filters.moduleId !== "all" && p.moduleId !== filters.moduleId) return false;
    return true;
  });
}

export function filterCertificates(certificates, filters, workerIdSet) {
  return certificates.filter((c) => {
    if (!workerIdSet.has(c.workerId)) return false;
    if (filters.moduleId !== "all" && c.moduleId !== filters.moduleId) return false;
    if (!withinDateRange(c.issuedDate, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function hasActiveFilters(filters) {
  return (
    filters.organization !== "all" ||
    filters.district !== "all" ||
    filters.language !== "all" ||
    filters.moduleId !== "all" ||
    !!filters.dateFrom ||
    !!filters.dateTo
  );
}
