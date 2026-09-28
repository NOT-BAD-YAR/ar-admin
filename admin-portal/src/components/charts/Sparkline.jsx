const WIDTH = 320;
const HEIGHT = 96;
const PAD = 10;

export function Sparkline({ points, color = "var(--series-1)" }) {
  if (points.length < 2) {
    return <p className="chart-note">Need at least 2 attempts to plot a trend.</p>;
  }
  const max = Math.max(100, ...points.map((p) => p.value));
  const min = Math.min(0, ...points.map((p) => p.value));
  const span = Math.max(1, max - min);
  const stepX = (WIDTH - PAD * 2) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = HEIGHT - PAD - ((p.value - min) / span) * (HEIGHT - PAD * 2);
    return { x, y, value: p.value, label: p.label };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="img" aria-label="Score progression across attempts">
      <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke="var(--axis-baseline)" strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="4" fill={color} stroke="var(--surface-1)" strokeWidth="1.5">
          <title>{`Attempt ${i + 1}: ${c.value}%`}</title>
        </circle>
      ))}
      <text x={coords[coords.length - 1].x} y={coords[coords.length - 1].y - 10} textAnchor="end" className="sparkline-label mono">
        {coords[coords.length - 1].value}%
      </text>
    </svg>
  );
}
