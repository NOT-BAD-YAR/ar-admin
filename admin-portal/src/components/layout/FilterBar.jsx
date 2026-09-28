import { useMemo, useState } from "react";
import { SlidersHorizontal, RotateCcw, Settings2 } from "lucide-react";
import { useWorkers, useAllProgress, useAllResults } from "../../hooks/useFirestoreData";
import { useSettings } from "../../state/SettingsContext";
import { listModuleIds } from "../../lib/filters";
import { moduleLabel } from "../../lib/aggregate";
import { JHARKHAND_DISTRICTS, LANGUAGES } from "../../lib/constants";
import { ThresholdsModal } from "./ThresholdsModal";

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useSettings();
  const workers = useWorkers();
  const progress = useAllProgress();
  const results = useAllResults();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const organizations = useMemo(
    () => Array.from(new Set(workers.data.map((w) => w.organization).filter(Boolean))).sort(),
    [workers.data]
  );

  const moduleIds = useMemo(() => listModuleIds(progress.data, results.data), [progress.data, results.data]);

  return (
    <div className="filter-bar">
      <div className="filter-bar-icon">
        <SlidersHorizontal size={14} strokeWidth={2.25} />
      </div>

      <label className="select-field select-field-compact">
        Organization
        <select value={filters.organization} onChange={(e) => setFilters({ organization: e.target.value })}>
          <option value="all">All</option>
          {organizations.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field select-field-compact">
        District
        <select value={filters.district} onChange={(e) => setFilters({ district: e.target.value })}>
          <option value="all">All</option>
          {JHARKHAND_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field select-field-compact">
        Language
        <select value={filters.language} onChange={(e) => setFilters({ language: e.target.value })}>
          <option value="all">All</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field select-field-compact">
        Module
        <select value={filters.moduleId} onChange={(e) => setFilters({ moduleId: e.target.value })}>
          <option value="all">All</option>
          {moduleIds.map((m) => (
            <option key={m} value={m}>
              {moduleLabel(m)}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field select-field-compact">
        From
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} />
      </label>

      <label className="select-field select-field-compact">
        To
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} />
      </label>

      <button className="btn btn-ghost filter-bar-reset" onClick={resetFilters} title="Reset all filters">
        <RotateCcw size={13} />
        Reset
      </button>

      <button className="btn btn-ghost filter-bar-settings" onClick={() => setSettingsOpen(true)} title="Compliance threshold settings">
        <Settings2 size={13} />
        Thresholds
      </button>

      {settingsOpen && <ThresholdsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
