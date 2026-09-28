const SEQ_STEPS = [
  { max: 20, color: "var(--seq-100)", ink: "var(--text-primary)" },
  { max: 40, color: "var(--seq-250)", ink: "var(--text-primary)" },
  { max: 60, color: "var(--seq-400)", ink: "#ffffff" },
  { max: 80, color: "var(--seq-550)", ink: "#ffffff" },
  { max: 101, color: "var(--seq-700)", ink: "#ffffff" },
];

function stepFor(value) {
  return SEQ_STEPS.find((s) => value < s.max) ?? SEQ_STEPS[SEQ_STEPS.length - 1];
}

/** districts: [{ name, riskScore (0-100), workerCount }] */
export function DistrictHeatmap({ districts }) {
  return (
    <div className="district-grid">
      {districts.map((d) => {
        const step = stepFor(d.riskScore);
        return (
          <div key={d.name} className="district-cell" style={{ background: step.color, color: step.ink }}>
            <span className="district-name">{d.name}</span>
            <span className="district-score mono">{Math.round(d.riskScore)}</span>
            <span className="district-meta">{d.workerCount} workers</span>
          </div>
        );
      })}
    </div>
  );
}
