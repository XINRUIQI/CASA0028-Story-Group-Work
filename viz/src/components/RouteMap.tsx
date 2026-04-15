"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Leg } from "@/lib/api";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}

function legColor(leg: Leg): string {
  if (leg.is_walking) return "#f0a945";
  if (leg.mode_id === "bus") return "#34d399";
  return "#5b8def";
}

interface RouteMapProps {
  legs: Leg[];
  label: string;
  accent?: string;
  supportCount?: number;
}

export default function RouteMap({
  legs,
  label,
  accent = "var(--accent-blue)",
  supportCount,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-0.118, 51.509],
      zoom: 11,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      const allCoords: [number, number][] = [];

      legs.forEach((leg, i) => {
        let coords: [number, number][] = [];
        if (leg.path) {
          coords = decodePolyline(leg.path);
        } else {
          const depLat = leg.departure_point.lat;
          const depLon = leg.departure_point.lon;
          const arrLat = leg.arrival_point.lat;
          const arrLon = leg.arrival_point.lon;
          if (depLat != null && depLon != null && arrLat != null && arrLon != null) {
            coords = [[depLon, depLat], [arrLon, arrLat]];
          }
        }

        if (coords.length >= 2) {
          allCoords.push(...coords);
          map.addSource(`route-${i}`, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            },
          });
          map.addLayer({
            id: `route-${i}`,
            type: "line",
            source: `route-${i}`,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": legColor(leg),
              "line-width": leg.is_walking ? 3 : 4,
              "line-opacity": leg.is_walking ? 0.6 : 0.85,
              "line-dasharray": leg.is_walking ? [2, 2] : [1, 0],
            },
          });
        }
      });

      legs.forEach((leg) => {
        const dep = leg.departure_point;
        if (dep.lat != null && dep.lon != null) {
          const el = document.createElement("div");
          el.className = "route-map-marker";
          el.style.background = legColor(leg);
          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([dep.lon, dep.lat])
            .addTo(map);
        }
      });
      const lastLeg = legs[legs.length - 1];
      if (lastLeg) {
        const arr = lastLeg.arrival_point;
        if (arr.lat != null && arr.lon != null) {
          const el = document.createElement("div");
          el.className = "route-map-marker";
          el.style.background = "#f472b6";
          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([arr.lon, arr.lat])
            .addTo(map);
        }
      }

      if (allCoords.length >= 2) {
        const lngs = allCoords.map((c) => c[0]);
        const lats = allCoords.map((c) => c[1]);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 30, duration: 0 },
        );
      }
    });

    return () => { map.remove(); };
  }, [legs]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="route-map-placeholder">
        <div className="route-map-label" style={{ color: accent }}>{label}</div>
        <div className="route-map-empty">
          <p>Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
          {legs.length > 0 && (
            <p className="route-map-stats">
              {legs.filter((l) => !l.is_walking).length} transit ·{" "}
              {legs.filter((l) => l.is_walking).length} walk segments
            </p>
          )}
        </div>
        {supportCount != null && (
          <div className="route-map-support">
            {supportCount} support points nearby
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="route-map-card">
      <div className="route-map-label" style={{ color: accent }}>{label}</div>
      <div ref={containerRef} className="route-map-container" />
      {supportCount != null && (
        <div className="route-map-support">
          {supportCount} support points nearby
        </div>
      )}
    </div>
  );
}
