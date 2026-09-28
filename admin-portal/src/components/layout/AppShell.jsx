import { Outlet, useLocation } from "react-router-dom";
import { Radio } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { FilterBar } from "./FilterBar";

const PAGE_META = {
  "/": {
    title: "Executive Command Center",
    subtitle: "State-wide KPIs, live incident feed & geo-spatial risk overview",
  },
  "/geo": {
    title: "Geo Analytics",
    subtitle: "Location-wise heatmap of AR assessment attempts across Jharkhand",
  },
  "/compliance": {
    title: "DGMS Statutory Compliance",
    subtitle: "Mines Act 1952 / Factories Act 1948 audit engine & orientation rule",
  },
  "/competency": {
    title: "7-Dimension Competency Radar",
    subtitle: "Skill gap diagnostics across every safety domain",
  },
  "/inspector": {
    title: "Attempt & Failure Inspector",
    subtitle: "Hesitation/panic index and step-by-step drill breakdowns",
  },
  "/certificates": {
    title: "Certificate Ledger & QR Verification",
    subtitle: "Cryptographic HMAC-SHA256 certificate authenticity center",
  },
  "/telemetry": {
    title: "Language & Offline Telemetry",
    subtitle: "Multilingual adoption and underground sync monitoring",
  },
};

export function AppShell() {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] ?? PAGE_META["/"];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="topbar">
          <div>
            <h1 className="topbar-title">{meta.title}</h1>
            <p className="topbar-subtitle">{meta.subtitle}</p>
          </div>
          <div className="live-indicator">
            <Radio size={14} strokeWidth={2.5} />
            Live Firestore
          </div>
        </header>
        <FilterBar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
