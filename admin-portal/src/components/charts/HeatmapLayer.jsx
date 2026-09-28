import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/** points: [[lat, lng, intensity], ...] */
export function HeatmapLayer({ points, options }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return undefined;
    const layer = L.heatLayer(points, { radius: 24, blur: 20, maxZoom: 12, ...options }).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, options]);

  return null;
}
