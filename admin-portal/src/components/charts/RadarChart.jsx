import { COMPETENCY_DIMENSIONS } from "../../lib/constants";

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_R = SIZE / 2 - 56;
const RINGS = [0.25, 0.5, 0.75, 1];

function pointFor(index, total, ratio) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [CENTER + Math.cos(angle) * MAX_R * ratio, CENTER + Math.sin(angle) * MAX_R * ratio];
}

function polygonPoints(values, total) {
  return values.map((v, i) => pointFor(i, total, Math.max(0, Math.min(1, v / 100)))).map((p) => p.join(",")).join(" ");
}

/**
 * series: [{ label, color, values: { [dimensionKey]: number 0-100 } }]
 * Up to 2 series recommended for legibility.
 */
export function CompetencyRadar({ series }) {
  const dims = COMPETENCY_DIMENSIONS;
  const total = dims.length;

  return (
    <div className="radar-wrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height={SIZE} role="img" aria-label="7-dimension competency radar">
        {RINGS.map((r) => (
          <polygon
            key={r}
            points={dims.map((_, i) => pointFor(i, total, r).join(",")).join(" ")}
            fill="none"
            stroke="var(--grid-hairline)"
            strokeWidth="1"
          />
        ))}
        {dims.map((d, i) => {
          const [x, y] = pointFor(i, total, 1);
          return (
            <line key={d.key} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--grid-hairline)" strokeWidth="1" />
          );
        })}

        {series.map((s) => (
          <polygon
            key={s.label}
            points={polygonPoints(dims.map((d) => s.values[d.key] ?? 0), total)}
            fill={s.color}
            fillOpacity="0.16"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
        {series.map((s) =>
          dims.map((d, i) => {
            const [x, y] = pointFor(i, total, Math.max(0, Math.min(1, (s.values[d.key] ?? 0) / 100)));
            return <circle key={`${s.label}-${d.key}`} cx={x} cy={y} r="3.5" fill={s.color} stroke="var(--surface-1)" strokeWidth="1.5" />;
          })
        )}

        {dims.map((d, i) => {
          const [x, y] = pointFor(i, total, 1.24);
          const anchor = Math.abs(x - CENTER) < 4 ? "middle" : x > CENTER ? "start" : "end";
          return (
            <text key={d.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="radar-axis-label">
              {d.label}
            </text>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.label} className="legend-item">
              <span className="legend-swatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
