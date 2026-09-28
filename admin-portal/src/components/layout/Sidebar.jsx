import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Radar,
  ListTree,
  BadgeCheck,
  Languages,
  Landmark,
  MapPinned,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, end: true },
  { to: "/geo", label: "Geo Analytics", icon: MapPinned },
  { to: "/compliance", label: "DGMS Compliance", icon: ShieldCheck },
  { to: "/competency", label: "Competency Radar", icon: Radar },
  { to: "/inspector", label: "Attempt Inspector", icon: ListTree },
  { to: "/certificates", label: "Certificate Ledger", icon: BadgeCheck },
  { to: "/telemetry", label: "Language & Telemetry", icon: Languages },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Landmark size={18} strokeWidth={2.25} />
        </div>
        <div>
          <p className="brand-title">DGMS Command Portal</p>
          <p className="brand-subtitle">Project 26041 · Jharkhand</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Firestore project</p>
        <p className="mono sidebar-project-id">minesafetyar</p>
      </div>
    </aside>
  );
}
