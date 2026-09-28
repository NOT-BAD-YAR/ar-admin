export function BarList({ items, valueFormatter = (v) => v, maxValue }) {
  const max = maxValue ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: item.color ?? "var(--series-1)" }}
            />
          </div>
          <span className="bar-value mono">{valueFormatter(item.value)}</span>
        </div>
      ))}
    </div>
  );
}
