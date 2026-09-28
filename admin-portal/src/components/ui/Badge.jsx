import { AlertTriangle, CheckCircle2, XCircle, Clock, Circle } from "lucide-react";

const STATUS_MAP = {
  good: { icon: CheckCircle2, className: "badge-good" },
  warning: { icon: AlertTriangle, className: "badge-warning" },
  serious: { icon: AlertTriangle, className: "badge-serious" },
  critical: { icon: XCircle, className: "badge-critical" },
  pending: { icon: Clock, className: "badge-neutral" },
  neutral: { icon: Circle, className: "badge-neutral" },
};

export function Badge({ status = "neutral", children }) {
  const entry = STATUS_MAP[status] ?? STATUS_MAP.neutral;
  const Icon = entry.icon;
  return (
    <span className={`badge ${entry.className}`}>
      <Icon size={12} strokeWidth={2.5} />
      {children}
    </span>
  );
}
