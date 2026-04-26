"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Timer,
  ShieldCheck,
  Route,
  Activity,
  Lightbulb,
  Info,
  ChevronDown,
  Zap,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api, type FairnessZone } from "@/lib/api";
import TimeSlider from "@/components/TimeSlider";
import { interpolateVitality, formatHour, DAYTIME_SNAPSHOT } from "@/lib/vitality";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoibGV2aW5lbGl1IiwiYSI6ImNta21vc3doOTBleGYza3IycDNsOXRidXQifQ.SdtOnvfZEml6QGLmnnduDQ";
const CENTER: [number, number] = [-0.118, 51.509];
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const GEOJSON_URL = `${BASE_PATH}/london-boroughs.geojson`;
const N_PTS = 400;

type LayerId =
  | "waiting_burden_increase"
  | "support_access_loss"
  | "recovery_difficulty_increase"
  | "activity_decline"
  | "low_light_walking_burden"
  | "city_vitality";

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
    id: "city_vitality",
    label: "City Vitality",
    icon: <Zap size={14} />,
    accent: "var(--champagne-gold)",
    unit: "vitality",
    description: "Composite City Vitality Index: how service frequency, support access, certainty, and safety decline from day to night.",
  },
  {
    id: "waiting_burden_increase",
    label: "Service Drop",
    icon: <Timer size={14} />,
    accent: "var(--accent-rose)",
    unit: "wait proxy",
    description: "Borough-level night supply thinning used as a proxy for extra waiting burden.",
  },
  {
    id: "support_access_loss",
    label: "Support Gap",
    icon: <ShieldCheck size={14} />,
    accent: "var(--accent-emerald)",
    unit: "access gap",
    description: "Borough-level mismatch between night activity need and nearby support availability.",
  },
  {
    id: "recovery_difficulty_increase",
    label: "Recovery Difficulty",
    icon: <Route size={14} />,
    accent: "var(--champagne-gold)",
    unit: "difficulty",
    description: "Higher where night activity remains visible but nearby support capacity is weak.",
  },
  {
    id: "activity_decline",
    label: "Activity Loss",
    icon: <Activity size={14} />,
    accent: "var(--accent-amber)",
    unit: "activity gap",
    description: "Borough-level relative decline in night-time activity and service footprint.",
  },
  {
    id: "low_light_walking_burden",
    label: "Low-Support Exposure",
    icon: <Lightbulb size={14} />,
    accent: "var(--champagne-gold)",
    unit: "exposure proxy",
    description: "Composite proxy from borough visibility context and MSOA support weakness.",
  },
];

const SCORE_GUIDE: Array<{
  id: LayerId;
  aboutHeading: string;
  body: string;
  higherLine: string;
}> = [
  {
    id: "city_vitality",
    aboutHeading: "About City Vitality",
    body: "A combined score showing how supported a borough feels at night. It brings together public transport service, nearby support places, service certainty, and safety context across representative routes.",
    higherLine: "Higher score = stronger night-time support.",
  },
  {
    id: "waiting_burden_increase",
    aboutHeading: "About Service Drop",
    body: "Shows how much public transport service becomes weaker at night. A higher score means services are less frequent, waiting may be longer, and the area may feel harder to move through after dark.",
    higherLine: "Higher score = bigger night-time service drop.",
  },
  {
    id: "support_access_loss",
    aboutHeading: "About Support Gap",
    body: "Shows where night-time activity is higher than the support available nearby. A higher score means people may be out at night, but there are fewer open places such as shops, food places, pubs, or other support points.",
    higherLine: "Higher score = larger gap between need and support.",
  },
  {
    id: "recovery_difficulty_increase",
    aboutHeading: "About Recovery Difficulty",
    body: "Shows how hard it may be to recover if a journey goes wrong. A higher score means fewer backup options, longer waits, or more difficulty finding another workable route.",
    higherLine: "Higher score = harder to recover.",
  },
  {
    id: "activity_decline",
    aboutHeading: "About Activity Loss",
    body: "Shows how much night-time activity has declined compared with the daytime or historical activity pattern. A higher score means the area becomes quieter, with fewer active places and less street-level activity.",
    higherLine: "Higher score = stronger activity decline.",
  },
  {
    id: "low_light_walking_burden",
    aboutHeading: "About Exposed Walking",
    body: "Shows where people may need to walk through areas with weaker late-night support. A higher score means the area has fewer open places, weaker visible support, or a less active street environment after dark.",
    higherLine: "Higher score = more exposed walking context.",
  },
];

function dropColor(ratio: number, min = 0, max = 0.8): string {
  const span = Math.max(max - min, 0.001);
  const t = Math.min(Math.max((Math.abs(ratio) - min) / span, 0), 1);
  const r = Math.round(240 - t * 166);
  const g = Math.round(184 - t * 126);
  const b = Math.round(122 + t * 0);
  return `rgb(${r},${g},${b})`;
}

function extractBorough(msoaName: string): string {
  const trimmed = msoaName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && /^\d{3}$/.test(parts[parts.length - 1])) {
    return parts.slice(0, -1).join(" ").toLowerCase();
  }
  return trimmed.toLowerCase();
}

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
  const drops = Object.values(boroughAgg).map((agg) => Math.abs(agg.drop));
  const minDrop = Math.min(...drops, 0);
  const maxDrop = Math.max(...drops, 0.001);

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
          fill_color: agg ? dropColor(agg.drop, minDrop, maxDrop) : "rgba(40,50,90,0.5)",
        },
      };
    }),
  };
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/* ── Vitality GeoJSON (point cloud) ── */

function sr(i: number, s = 0) {
  const x = Math.sin((i + s) * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildVitalityGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < N_PTS; i++) {
    const angle = sr(i) * Math.PI * 2;
    const dist = Math.sqrt(-2 * Math.log(Math.max(sr(i, 50), 0.001))) * 0.07;
    const threshold = sr(i, 100);
    features.push({
      type: "Feature",
      properties: { t: threshold },
      geometry: {
        type: "Point",
        coordinates: [
          CENTER[0] + Math.cos(angle) * dist * 1.6,
          CENTER[1] + Math.sin(angle) * dist,
        ],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/* ── Main component ── */

export default function FairnessPanel() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("city_vitality");
  const [hour, setHour] = useState(9);
  const [showScoreGuide, setShowScoreGuide] = useState(false);
  const [zones, setZones] = useState<Record<string, FairnessZone>>({});
  const [fetchedLayer, setFetchedLayer] = useState<string>("");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);
  const geoRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const zonesRef = useRef<Record<string, FairnessZone>>({});
  const vitalityGeoJSON = useMemo(() => buildVitalityGeoJSON(), []);

  const isVitality = activeLayer === "city_vitality";
  const loading = !isVitality && activeLayer !== fetchedLayer;

  const snap = interpolateVitality(hour);
  const day = DAYTIME_SNAPSHOT;

  useEffect(() => { zonesRef.current = zones; }, [zones]);

  const updateChoropleth = useCallback(() => {
    const m = mapRef.current;
    if (!m || !readyRef.current || !geoRef.current) return;
    const src = m.getSource("boroughs") as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(mergeGeoWithZones(geoRef.current, zonesRef.current));
  }, []);

  /* Fetch borough GeoJSON once */
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        geoRef.current = data;
        updateChoropleth();
      })
      .catch(() => {});
  }, [updateChoropleth]);

  /* Fetch choropleth layer data (skip for city_vitality) */
  useEffect(() => {
    if (isVitality) { setFetchedLayer("city_vitality"); return; }
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
  }, [activeLayer, isVitality]);

  useEffect(() => {
    updateChoropleth();
  }, [zones, updateChoropleth]);

  /* ── Apply vitality theme to map ── */
  const applyVitality = useCallback((m: mapboxgl.Map, h: number, density: number, color: string) => {
    const labelOp = h <= 18 ? 0.7 : h <= 21 ? 0.7 - ((h - 18) / 3) * 0.15 : 0.55 - ((h - 21) / 4) * 0.1;

    for (const l of m.getStyle()?.layers ?? []) {
      if (l.type === "symbol" && (l.id.includes("label") || l.id.includes("place")))
        m.setPaintProperty(l.id, "text-opacity", labelOp);
    }

    if (m.getLayer("pts-vitality")) {
      m.setFilter("pts-vitality", ["<=", ["get", "t"], density]);
      m.setPaintProperty("pts-vitality", "circle-color", color);
      m.setPaintProperty("pts-vitality", "circle-opacity", 0.5 + density * 0.45);
    }
    if (m.getLayer("pts-glow")) {
      m.setFilter("pts-glow", ["<=", ["get", "t"], density]);
      m.setPaintProperty("pts-glow", "circle-color", color);
      m.setPaintProperty("pts-glow", "circle-opacity", 0.15 + (h > 21 ? 0.12 : 0));
    }
  }, []);

  /* ── Reset map theme (when leaving vitality) ── */
  const resetMapTheme = useCallback((m: mapboxgl.Map) => {
    for (const l of m.getStyle()?.layers ?? []) {
      if (l.type === "symbol" && (l.id.includes("label") || l.id.includes("place")))
        m.setPaintProperty(l.id, "text-opacity", 1);
    }
  }, []);

  /* ── Initialize map ── */
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
      style: "mapbox://styles/mapbox/light-v11",
      center: CENTER,
      zoom: 9.3,
      interactive: true,
      attributionControl: false,
    });
    mapRef.current = m;

    // 3. Scale bar (bottom — added first, stacks at bottom)
    const scaleCtrl = new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" });
    m.addControl(scaleCtrl, "bottom-left");
    const scaleEl = (scaleCtrl as unknown as { _container?: HTMLElement })._container;
    if (scaleEl) {
      const fixLang = () => {
        const txt = scaleEl.textContent || "";
        const fixed = txt.replace(/公里/, "km").replace(/米/, "m");
        if (fixed !== txt) scaleEl.textContent = fixed;
      };
      fixLang();
      new MutationObserver(fixLang).observe(scaleEl, { childList: true, characterData: true, subtree: true });
    }

    // 2. Home / reset view (middle)
    class HomeControl implements mapboxgl.IControl {
      _container?: HTMLElement;
      onAdd() {
        const btn = document.createElement("button");
        btn.className = "fairness-home-ctrl";
        btn.type = "button";
        btn.title = "Reset view";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>`;
        btn.addEventListener("click", () => {
          mapRef.current?.flyTo({ center: CENTER, zoom: 9.3, pitch: 0, bearing: 0, duration: 800 });
        });
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.appendChild(btn);
        this._container = div;
        return div;
      }
      onRemove() { this._container?.remove(); }
    }
    m.addControl(new HomeControl(), "bottom-left");

    // 1. Compass (top — added last, stacks at top)
    m.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: false }), "bottom-left");

    m.on("load", () => {
      if (mapRef.current !== m) return;
      m.resize();

      // Fade base map layers, keep custom layers at full opacity
      const BASE_OPACITY = 0.45;
      for (const l of m.getStyle()?.layers ?? []) {
        try {
          if (l.type === "background")
            m.setPaintProperty(l.id, "background-opacity", BASE_OPACITY);
          else if (l.type === "fill" && !l.id.startsWith("borough"))
            m.setPaintProperty(l.id, "fill-opacity", BASE_OPACITY);
          else if (l.type === "line" && !l.id.startsWith("borough"))
            m.setPaintProperty(l.id, "line-opacity", BASE_OPACITY);
          else if (l.type === "symbol")
            m.setPaintProperty(l.id, "text-opacity", BASE_OPACITY + 0.15);
        } catch { /* ok */ }
        if (l.type === "symbol") {
          try { m.setPaintProperty(l.id, "text-opacity-transition", { duration: 600 }); } catch { /* ok */ }
        }
      }

      // Choropleth layers
      const initData = geoRef.current
        ? mergeGeoWithZones(geoRef.current, zonesRef.current)
        : EMPTY_FC;

      m.addSource("boroughs", { type: "geojson", data: initData });
      m.addLayer({
        id: "borough-fills", type: "fill", source: "boroughs",
        layout: { visibility: "none" },
        paint: {
          "fill-color": ["coalesce", ["get", "fill_color"], "rgba(40,50,90,0.5)"],
          "fill-opacity": 0.75,
        },
      });
      m.addLayer({
        id: "borough-borders", type: "line", source: "boroughs",
        layout: { visibility: "none" },
        paint: { "line-color": "rgba(200,200,220,0.25)", "line-width": 1 },
      });

      // Vitality point layers
      m.addSource("vp", { type: "geojson", data: vitalityGeoJSON });
      m.addLayer({
        id: "pts-glow", type: "circle", source: "vp",
        paint: {
          "circle-radius": 14, "circle-color": "#d4944a",
          "circle-opacity": 0, "circle-opacity-transition": { duration: 600 },
          "circle-blur": 1,
        },
      });
      m.addLayer({
        id: "pts-vitality", type: "circle", source: "vp",
        paint: {
          "circle-radius": 4, "circle-color": "#d4944a",
          "circle-opacity": 0.85, "circle-opacity-transition": { duration: 600 },
        },
      });

      // Borough popup
      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: "fairness-popup" });
      m.on("mousemove", "borough-fills", (e) => {
        m.getCanvas().style.cursor = "pointer";
        const props = e.features?.[0]?.properties;
        if (props) {
          popup.setLngLat(e.lngLat).setHTML(
            `<strong>${props.name}</strong><br/>` +
            `Score: ${(props.drop_ratio * 100).toFixed(0)}% &middot; Reference: ${(Number(props.day_value) * 100).toFixed(0)}% &middot; Value: ${(Number(props.night_value) * 100).toFixed(0)}%`
          ).addTo(m);
        }
      });
      m.on("mouseleave", "borough-fills", () => {
        m.getCanvas().style.cursor = "";
        popup.remove();
      });

      readyRef.current = true;

      // Apply vitality theme immediately so the map starts yellow
      const initSnap = interpolateVitality(9);
      applyVitality(m, 9, initSnap.density, initSnap.color);
    });

    return () => {
      m.remove();
      if (mapRef.current === m) { mapRef.current = null; readyRef.current = false; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Toggle layer visibility ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !readyRef.current) return;

    const showChoropleth = !isVitality;
    if (m.getLayer("borough-fills"))
      m.setLayoutProperty("borough-fills", "visibility", showChoropleth ? "visible" : "none");
    if (m.getLayer("borough-borders"))
      m.setLayoutProperty("borough-borders", "visibility", showChoropleth ? "visible" : "none");
    if (m.getLayer("pts-vitality"))
      m.setLayoutProperty("pts-vitality", "visibility", isVitality ? "visible" : "none");
    if (m.getLayer("pts-glow"))
      m.setLayoutProperty("pts-glow", "visibility", isVitality ? "visible" : "none");

    if (isVitality) {
      applyVitality(m, hour, snap.density, snap.color);
    } else {
      resetMapTheme(m);
    }
  }, [activeLayer, isVitality, hour, snap.density, snap.color, applyVitality, resetMapTheme]);

  /* ── Vitality time update ── */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !readyRef.current || !isVitality) return;
    applyVitality(m, hour, snap.density, snap.color);
  }, [hour, snap.density, snap.color, isVitality, applyVitality]);

  const activeLayerDef = LAYERS.find((l) => l.id === activeLayer);
  const activeGuide = SCORE_GUIDE.find((item) => item.id === activeLayer);

  return (
    <div className="fairness-page-wrap fullscreen-mode">

      {/* ── Map section (always fullscreen) ── */}
      <div className="fairness-map-section map-fullscreen">
        {/* Sidebar (always floating) */}
        <div className="fairness-sidebar sidebar-float">
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

          {activeGuide && (
            <div className="fairness-score-guide">
              <button
                type="button"
                className={`fairness-score-guide-toggle ${showScoreGuide ? "active" : ""}`}
                onClick={() => setShowScoreGuide((open) => !open)}
                aria-expanded={showScoreGuide}
              >
                <Info size={12} className="fairness-score-guide-icon" />
                <span className="fairness-score-guide-title">Score guide: {activeLayerDef?.label}</span>
                <ChevronDown
                  size={12}
                  className={showScoreGuide ? "fairness-score-guide-chevron open" : "fairness-score-guide-chevron"}
                />
              </button>

              {showScoreGuide && (
                <div key={activeLayer} className="fairness-score-guide-panel">
                  <p className="fairness-score-guide-heading">{activeGuide.aboutHeading}</p>
                  <p className="fairness-score-guide-body">{activeGuide.body}</p>
                  <p className="fairness-score-guide-higher">{activeGuide.higherLine}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fairness-map-area">
          {MAPBOX_TOKEN ? (
            <div ref={mapContainerRef} className="fairness-map-container" />
          ) : (
            <div className="fairness-map-placeholder">
              <p>Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
            </div>
          )}

          {/* Vitality: TimeSlider overlay */}
          {isVitality && (
            <div className="fairness-vitality-slider">
              <TimeSlider hour={hour} onChange={setHour} color={snap.color} />
            </div>
          )}

          {/* Vitality: bottom stats overlay */}
          {isVitality && (
            <div className="fairness-vitality-foot">
              <div className="ov2-bar glow">
                <div className="ov2-vitality-hero">
                  <span className="ov2-vitality-label">City Vitality</span>
                  <span className="ov2-vitality-val" style={{ color: snap.color }}>
                    {Math.round(snap.density * 100)}%
                  </span>
                </div>
                <div className="ov2-sep" />
                <VitalityBar label="Service level" value={snap.components.service_freq} base={day.components.service_freq} color={snap.color} />
                <VitalityBar label="Support" value={snap.components.support_access} base={day.components.support_access} color={snap.color} />
                <VitalityBar label="Certainty" value={snap.components.certainty} base={day.components.certainty} color={snap.color} />
                <VitalityBar label="Safety" value={snap.components.safety} base={day.components.safety} color={snap.color} />
              </div>
              <p className="ov2-quote">
                {formatHour(hour)} &mdash;{" "}
                {snap.density >= 0.85
                  ? "The city is alive — services run frequently, support is everywhere."
                  : snap.density >= 0.6
                    ? "Services are thinning. Shops close, headways stretch, support fades."
                    : "The city has emptied. Long waits, few options, little support nearby."}
              </p>
            </div>
          )}

          {/* Choropleth: legend */}
          {!isVitality && (
            <div className="fairness-legend">
              <span className="fairness-legend-title">
                Layer intensity [low &rarr; high]
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
          )}

          {loading && (
            <div className="fairness-map-loading">Loading&hellip;</div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── Sub-components ── */

function VitalityBar({ label, value, base, color }: {
  label: string; value: number; base: number; color: string;
}) {
  const pct = Math.round(value * 100);
  const change = base === 0 ? 0 : Math.round(((value - base) / base) * 100);
  return (
    <div className="ov2-vbar">
      <span className="ov2-vbar-label">{label}</span>
      <div className="ov2-vbar-track">
        <div className="ov2-vbar-fill" style={{ width: `${pct}%`, background: color, transition: "width 0.5s, background 0.5s" }} />
      </div>
      <span className="ov2-vbar-val" style={{ color }}>
        {pct}%
        {change < 0 && <span className="ov2-vbar-change">{change}%</span>}
      </span>
    </div>
  );
}
