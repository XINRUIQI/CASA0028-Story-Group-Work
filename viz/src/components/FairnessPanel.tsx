"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Timer,
  ShieldCheck,
  Route,
  Activity,
  Lightbulb,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api, type FairnessZone } from "@/lib/api";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const CENTER: [number, number] = [-0.118, 51.509];
const GEOJSON_URL = "/london-boroughs.geojson";

type LayerId =
  | "waiting_burden_increase"
  | "support_access_loss"
  | "recovery_difficulty_increase"
  | "activity_decline"
  | "low_light_walking_burden";

interface LayerDef {
  id: LayerId;
  label: string;
  icon: React.ReactNode;
  accent: string;
  unit: string;
  description: string;
}

const LAYERS: LayerDef[] = [
  {
    id: "waiting_burden_increase",
    label: "Waiting burden increase",
    icon: <Timer size={14} />,
    accent: "var(--accent-rose)",
    unit: "min headway",
    description: "How much longer passengers wait at night compared to daytime.",
  },
  {
    id: "support_access_loss",
    label: "Support access loss",
    icon: <ShieldCheck size={14} />,
    accent: "var(--accent-emerald)",
    unit: "open POIs",
    description: "How many support facilities close after dark in each area.",
  },
  {
    id: "recovery_difficulty_increase",
    label: "Recovery difficulty",
    icon: <Route size={14} />,
    accent: "var(--champagne-gold)",
    unit: "fallback routes",
    description: "How much harder it becomes to recover from a missed connection.",
  },
  {
    id: "activity_decline",
    label: "Activity decline",
    icon: <Activity size={14} />,
    accent: "var(--accent-amber)",
    unit: "activity ratio",
    description: "How much the 'someone is around' presence fades at night.",
  },
  {
    id: "low_light_walking_burden",
    label: "Low-light walking burden",
    icon: <Lightbulb size={14} />,
    accent: "var(--champagne-gold)",
    unit: "lit share",
    description: "Night walking burden in areas with less lighting infrastructure.",
  },
];

const INNER_BOROUGHS = new Set([
  "Camden", "City of London", "Greenwich", "Hackney", "Hammersmith and Fulham",
  "Islington", "Kensington and Chelsea", "Lambeth", "Lewisham", "Newham",
  "Southwark", "Tower Hamlets", "Wandsworth", "Westminster",
]);

function dropColor(ratio: number): string {
  const t = Math.min(Math.max(Math.abs(ratio), 0), 0.8) / 0.8;
  const r = Math.round(50 + t * 151);
  const g = Math.round(48 + t * 121);
  const b = Math.round(60 + t * 50);
  return `rgb(${r},${g},${b})`;
}

function dropLabel(drop: number): { text: string; color: string } {
  const abs = Math.abs(drop);
  if (abs >= 0.7) return { text: "Large gap", color: "var(--accent-amber)" };
  if (abs >= 0.4) return { text: "Notable gap", color: "var(--champagne-gold)" };
  if (abs >= 0.15) return { text: "Moderate gap", color: "var(--text-secondary)" };
  return { text: "Minimal change", color: "var(--accent-emerald)" };
}

/** Extract borough name from MSOA name (e.g. "Camden 016" → "camden") */
function extractBorough(msoaName: string): string {
  const trimmed = msoaName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && /^\d{3}$/.test(parts[parts.length - 1])) {
    return parts.slice(0, -1).join(" ").toLowerCase();
  }
  return trimmed.toLowerCase();
}

/** Aggregate MSOA zones to borough level, then merge into GeoJSON */
function mergeGeoWithZones(
  geo: GeoJSON.FeatureCollection,
  zoneData: Record<string, FairnessZone>,
): GeoJSON.FeatureCollection {
  const boroughBuckets: Record<string, FairnessZone[]> = {};
  for (const z of Object.values(zoneData)) {
    const borough = extractBorough(z.name);
    if (!boroughBuckets[borough]) boroughBuckets[borough] = [];
    boroughBuckets[borough].push(z);
  }

  const boroughAgg: Record<string, { drop: number; day: number; night: number }> = {};
  for (const [borough, list] of Object.entries(boroughBuckets)) {
    const n = list.length;
    boroughAgg[borough] = {
      drop: list.reduce((s, z) => s + z.drop_ratio, 0) / n,
      day: list.reduce((s, z) => s + z.day_value, 0) / n,
      night: list.reduce((s, z) => s + z.night_value, 0) / n,
    };
  }

  return {
    type: "FeatureCollection",
    features: geo.features.map((f) => {
      const name = (f.properties?.name || "").toLowerCase();
      const agg = boroughAgg[name];
      return {
        ...f,
        properties: {
          ...f.properties,
          drop_ratio: agg ? Math.abs(agg.drop) : 0,
          day_value: agg ? agg.day : 0,
          night_value: agg ? agg.night : 0,
          fill_color: agg ? dropColor(agg.drop) : "rgba(40,50,90,0.5)",
        },
      };
    }),
  };
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/* ── Main component ── */

export default function FairnessPanel() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("support_access_loss");
  const [zones, setZones] = useState<Record<string, FairnessZone>>({});
  const [fetchedLayer, setFetchedLayer] = useState<string>("");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);
  const geoRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const zonesRef = useRef<Record<string, FairnessZone>>({});
  const loading = activeLayer !== fetchedLayer;

  useEffect(() => { zonesRef.current = zones; }, [zones]);

  const updateChoropleth = useCallback(() => {
    const m = mapRef.current;
    if (!m || !readyRef.current || !geoRef.current) return;
    const src = m.getSource("boroughs") as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(mergeGeoWithZones(geoRef.current, zonesRef.current));
  }, []);

  /* Fetch GeoJSON once */
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        geoRef.current = data;
        updateChoropleth();
      })
      .catch(() => {});
  }, [updateChoropleth]);

  /* Fetch layer data */
  useEffect(() => {
    let stale = false;
    api
      .getFairnessLayer(activeLayer)
      .then((res) => {
        if (!stale) {
          setZones(res.zones || {});
          setFetchedLayer(activeLayer);
        }
      })
      .catch(() => {
        if (!stale) { setZones({}); setFetchedLayer(activeLayer); }
      });
    return () => { stale = true; };
  }, [activeLayer]);

  useEffect(() => {
    updateChoropleth();
  }, [zones, updateChoropleth]);

  /* Initialize map (once, no dependency on data) */
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || !MAPBOX_TOKEN) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      readyRef.current = false;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: el,
      style: "mapbox://styles/mapbox/dark-v11",
      center: CENTER,
      zoom: 9.3,
      interactive: true,
      attributionControl: false,
    });
    mapRef.current = m;

    m.on("load", () => {
      if (mapRef.current !== m) return;
      m.resize();

      const initData = geoRef.current
        ? mergeGeoWithZones(geoRef.current, zonesRef.current)
        : EMPTY_FC;

      m.addSource("boroughs", { type: "geojson", data: initData });

      m.addLayer({
        id: "borough-fills",
        type: "fill",
        source: "boroughs",
        paint: {
          "fill-color": ["coalesce", ["get", "fill_color"], "rgba(40,50,90,0.5)"],
          "fill-opacity": 0.75,
        },
      });
      m.addLayer({
        id: "borough-borders",
        type: "line",
        source: "boroughs",
        paint: {
          "line-color": "rgba(200,200,220,0.25)",
          "line-width": 1,
        },
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "fairness-popup",
      });
      m.on("mousemove", "borough-fills", (e) => {
        m.getCanvas().style.cursor = "pointer";
        const props = e.features?.[0]?.properties;
        if (props) {
          const drop = (props.drop_ratio * 100).toFixed(0);
          const night = Number(props.night_value).toFixed(1);
          const day = Number(props.day_value).toFixed(1);
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<strong>${props.name}</strong><br/>` +
              `Gap: ${drop}% &middot; Day: ${day} &middot; Night: ${night}`
            )
            .addTo(m);
        }
      });
      m.on("mouseleave", "borough-fills", () => {
        m.getCanvas().style.cursor = "";
        popup.remove();
      });

      readyRef.current = true;
    });

    return () => {
      m.remove();
      if (mapRef.current === m) {
        mapRef.current = null;
        readyRef.current = false;
      }
    };
  }, []);

  /* Aggregate MSOA zones → borough-level entries for UI display */
  const boroughMap: Record<string, { name: string; day: number; night: number; drop: number; count: number }> = {};
  for (const z of Object.values(zones)) {
    const borough = extractBorough(z.name);
    const proper = z.name.replace(/\s+\d{3}$/, "");
    if (!boroughMap[borough]) {
      boroughMap[borough] = { name: proper, day: 0, night: 0, drop: 0, count: 0 };
    }
    const b = boroughMap[borough];
    b.day += z.day_value;
    b.night += z.night_value;
    b.drop += z.drop_ratio;
    b.count += 1;
  }
  const aggregatedZones: [string, FairnessZone][] = Object.entries(boroughMap).map(
    ([key, b]) => [
      key,
      {
        name: b.name,
        day_value: b.day / b.count,
        night_value: b.night / b.count,
        drop_ratio: b.drop / b.count,
        percentile: 0,
      },
    ],
  );
  const sortedZones = aggregatedZones.sort(
    ([, a], [, b]) => Math.abs(b.drop_ratio) - Math.abs(a.drop_ratio),
  );
  const innerZones = sortedZones.filter(([, z]) => INNER_BOROUGHS.has(z.name));
  const outerZones = sortedZones.filter(([, z]) => !INNER_BOROUGHS.has(z.name));

  return (
    <div className="fairness-page-wrap">
      {/* ── Title ── */}
      <div className="fairness-hero">
        <p className="section-label">City-wide Fairness &middot; Mobility Support Inequality</p>
        <h1 className="fairness-hero-title">
          Where Does the Day-to-Night Gap{" "}
          <span style={{ color: "var(--accent-amber)" }}>Widen Most?</span>
        </h1>
        <p className="fairness-hero-sub">
          Which areas are more likely to lose high-support public transport
          experience at night?
        </p>
        <p className="fairness-hero-note">
          This page compares the relative drop from day to night — not absolute
          night-time values. A large drop means the gap between daytime and
          night-time experience is wider.
        </p>
      </div>

      {/* ── Map section: sidebar + map ── */}
      <div className="fairness-map-section">
        <div className="fairness-sidebar">
          {LAYERS.map((l) => {
            const isActive = activeLayer === l.id;
            return (
              <label
                key={l.id}
                className={`fairness-radio-item ${isActive ? "active" : ""}`}
                style={isActive ? { borderColor: l.accent, color: l.accent } : undefined}
              >
                <input
                  type="radio"
                  name="fairness-layer"
                  className="fairness-radio-input"
                  checked={isActive}
                  onChange={() => setActiveLayer(l.id)}
                />
                <span
                  className="fairness-radio-dot"
                  style={{
                    borderColor: isActive ? l.accent : "var(--text-muted)",
                    background: isActive ? l.accent : "transparent",
                  }}
                />
                <span className="fairness-radio-label">{l.label}</span>
              </label>
            );
          })}
        </div>

        <div className="fairness-map-area">
          {MAPBOX_TOKEN ? (
            <div ref={mapContainerRef} className="fairness-map-container" />
          ) : (
            <div className="fairness-map-placeholder">
              <p>Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
            </div>
          )}

          <div className="fairness-legend">
            <span className="fairness-legend-title">
              Day-to-Night Gap [0% &rarr; 80%]
            </span>
            <div className="fairness-legend-bar" />
            <div className="fairness-legend-labels">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
            </div>
          </div>

          {loading && (
            <div className="fairness-map-loading">Loading&hellip;</div>
          )}
        </div>
      </div>

      {/* ── Ethical disclaimer ── */}
      <p className="fairness-disclaimer">
        This map does not indicate safety or danger. It highlights where the gap
        between daytime and night-time public transport support is largest —
        areas that may benefit most from targeted service investment.
      </p>

      {/* ── Bottom: Small Multiples ── */}
      {!loading && sortedZones.length > 0 && (
        <div className="fairness-sm-row">
          <SmallMultipleChart
            title="Small Multiples: Inner vs Outer Support Drop"
            innerZones={innerZones}
            outerZones={outerZones}
            legendLabels={["Inner London", "Peripheral London"]}
          />
          <SmallMultipleChart
            title="Small Multiples: Region-Type Support Drop"
            innerZones={innerZones}
            outerZones={outerZones}
            legendLabels={["Region-type-specific", "Region performance"]}
          />
        </div>
      )}

      {/* ── Inner vs Outer comparison ── */}
      {!loading && sortedZones.length > 0 && (
        <div className="fairness-bottom-section">
          <div className="fairness-comparison">
            <ZoneGroup title="Inner London" zones={innerZones} />
            <ZoneGroup title="Outer London" zones={outerZones} />
          </div>

          <div className="fairness-rank">
            <h4 className="fairness-rank-title">Day-to-night change by area</h4>
            <div className="fairness-bars">
              {sortedZones.slice(0, 15).map(([code, zone]) => {
                const abs = Math.abs(zone.drop_ratio);
                const barWidth = Math.min(abs * 100, 100);
                const dl = dropLabel(zone.drop_ratio);
                return (
                  <div key={code} className="fairness-bar-row">
                    <span className="fairness-bar-name">{zone.name}</span>
                    <div className="fairness-bar-track">
                      <div
                        className="fairness-bar-fill"
                        style={{ width: `${barWidth}%`, background: dl.color }}
                      />
                    </div>
                    <span className="fairness-bar-value" style={{ color: dl.color }}>
                      {(zone.drop_ratio * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Zone Group ── */

function ZoneGroup({
  title,
  zones,
}: {
  title: string;
  zones: [string, FairnessZone][];
}) {
  if (zones.length === 0) return null;

  const avgDay = zones.reduce((s, [, z]) => s + z.day_value, 0) / zones.length;
  const avgNight = zones.reduce((s, [, z]) => s + z.night_value, 0) / zones.length;
  const avgDrop = zones.reduce((s, [, z]) => s + z.drop_ratio, 0) / zones.length;
  const dl = dropLabel(avgDrop);

  return (
    <div className="fairness-group">
      <h4 className="fairness-group-title">{title}</h4>
      <div className="fairness-group-stats">
        <div className="fairness-group-stat">
          <span className="fairness-group-val">{avgDay.toFixed(1)}</span>
          <span className="fairness-group-lbl">Day baseline</span>
        </div>
        <span className="fairness-group-arrow">&rarr;</span>
        <div className="fairness-group-stat">
          <span className="fairness-group-val">{avgNight.toFixed(1)}</span>
          <span className="fairness-group-lbl">Night value</span>
        </div>
        <div className="fairness-group-stat">
          <span className="fairness-group-val" style={{ color: dl.color }}>
            {(avgDrop * 100).toFixed(0)}%
          </span>
          <span className="fairness-group-lbl" style={{ color: dl.color }}>
            {dl.text}
          </span>
        </div>
      </div>
      <p className="fairness-group-zones">
        {zones.map(([, z]) => z.name).join(" · ")}
      </p>
    </div>
  );
}

/* ── Small Multiple Line Chart ── */

function SmallMultipleChart({
  title,
  innerZones,
  outerZones,
  legendLabels,
}: {
  title: string;
  innerZones: [string, FairnessZone][];
  outerZones: [string, FairnessZone][];
  legendLabels: [string, string];
}) {
  const W = 360;
  const H = 180;
  const PAD = { top: 35, right: 20, bottom: 30, left: 40 };

  const innerPts = innerZones.slice(0, 8).map(([, z], i) => ({
    x: PAD.left + ((W - PAD.left - PAD.right) * (i + 1)) / 9,
    y: PAD.top + (1 - Math.abs(z.drop_ratio) / 0.8) * (H - PAD.top - PAD.bottom),
  }));
  const outerPts = outerZones.slice(0, 8).map(([, z], i) => ({
    x: PAD.left + ((W - PAD.left - PAD.right) * (i + 1)) / 9,
    y: PAD.top + (1 - Math.abs(z.drop_ratio) / 0.8) * (H - PAD.top - PAD.bottom),
  }));

  const makePath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const yTicks = [0, 20, 40, 60, 80];

  return (
    <div className="fairness-sm-card">
      <div className="fairness-sm-header">
        <h4 className="fairness-sm-title">{title}</h4>
        <div className="fairness-sm-legend">
          <span className="fairness-sm-dot" style={{ background: "#d4946a" }} />
          <span>{legendLabels[0]}</span>
          <span className="fairness-sm-dot" style={{ background: "#c9a96e" }} />
          <span>{legendLabels[1]}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="fairness-sm-svg">
        {yTicks.map((v) => {
          const y = PAD.top + (1 - v / 80) * (H - PAD.top - PAD.bottom);
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(200,200,220,0.1)" />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fill="#6b7194" fontSize="9">
                {v}
              </text>
            </g>
          );
        })}
        <text x={PAD.left + 30} y={H - 8} fill="#6b7194" fontSize="9" textAnchor="middle">Inner</text>
        <text x={W / 2} y={H - 8} fill="#6b7194" fontSize="9" textAnchor="middle">Area</text>
        <text x={W - PAD.right - 30} y={H - 8} fill="#6b7194" fontSize="9" textAnchor="middle">Outer</text>
        <text x={12} y={H / 2} fill="#6b7194" fontSize="9" textAnchor="middle" transform={`rotate(-90,12,${H / 2})`}>
          Support Drop
        </text>
        {innerPts.length > 1 && (
          <path d={makePath(innerPts)} fill="none" stroke="#d4946a" strokeWidth="2" opacity="0.85" />
        )}
        {outerPts.length > 1 && (
          <path d={makePath(outerPts)} fill="none" stroke="#c9a96e" strokeWidth="2" opacity="0.85" />
        )}
        {innerPts.map((p, i) => (
          <circle key={`i${i}`} cx={p.x} cy={p.y} r="3" fill="#d4946a" />
        ))}
        {outerPts.map((p, i) => (
          <circle key={`o${i}`} cx={p.x} cy={p.y} r="3" fill="#c9a96e" />
        ))}
      </svg>
    </div>
  );
}
