import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./state/SettingsContext";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Compliance } from "./pages/Compliance";
import { Competency } from "./pages/Competency";
import { AttemptInspector } from "./pages/AttemptInspector";
import { Certificates } from "./pages/Certificates";
import { Telemetry } from "./pages/Telemetry";
import { GeoAnalytics } from "./pages/GeoAnalytics";

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/geo" element={<GeoAnalytics />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/competency" element={<Competency />} />
            <Route path="/inspector" element={<AttemptInspector />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/telemetry" element={<Telemetry />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
