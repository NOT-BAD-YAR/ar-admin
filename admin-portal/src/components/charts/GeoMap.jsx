import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { HeatmapLayer } from "./HeatmapLayer";
import { moduleLabel } from "../../lib/aggregate";
import { formatDate } from "../../lib/format";

const JHARKHAND_CENTER = [23.65, 85.6];

const STATUS_HEX = { good: "#0ca30c", warning: "#fab219", critical: "#d03b3b" };

function markerColor(score) {
  if (score >= 75) return STATUS_HEX.good;
  if (score >= 50) return STATUS_HEX.warning;
  return STATUS_HEX.critical;
}

/**
 * points: [{ lat, lng, score, workerName, moduleId, district, locationName, capturedOffline, timestamp }]
 * mode: "heat" (risk-weighted density) | "points" (individual clickable markers)
 */
export function GeoMap({ points, mode = "heat", height = 420 }) {
  const heatPoints = points.map((p) => [p.lat, p.lng, Math.max(0.15, (100 - p.score) / 100)]);

  return (
    <MapContainer
      center={JHARKHAND_CENTER}
      zoom={7}
      style={{ height, width: "100%", borderRadius: "var(--radius-md)" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mode === "heat" && <HeatmapLayer points={heatPoints} />}
      {mode === "points" &&
        points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={7}
            pathOptions={{ color: markerColor(p.score), fillColor: markerColor(p.score), fillOpacity: 0.75, weight: 1.5 }}
          >
            <Popup>
              <strong>{p.workerName}</strong>
              <br />
              {moduleLabel(p.moduleId)}
              <br />
              Score: {p.score}%
              <br />
              {p.locationName ?? p.district ?? "Unknown location"}
              <br />
              {formatDate(p.timestamp)}
              {p.capturedOffline && (
                <>
                  <br />
                  <em>Captured offline</em>
                </>
              )}
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
