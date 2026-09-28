export function StatCard({ icon: Icon, label, value, sublabel, tone = "default" }) {
  return (
    <div className={`stat-card stat-tone-${tone}`}>
      <div className="stat-icon">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value mono">{value}</p>
        {sublabel && <p className="stat-sublabel">{sublabel}</p>}
      </div>
    </div>
  );
}
