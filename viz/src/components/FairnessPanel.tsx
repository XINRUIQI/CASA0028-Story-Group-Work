"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoibGV2aW5lbGl1IiwiYSI6ImNta21vc3doOTBleGYza3IycDNsOXRidXQifQ.SdtOnvfZEml6QGLmnnduDQ";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const GEOJSON_URL = `${BASE_PATH}/london-boroughs.geojson`;
const DATA_URL = `${BASE_PATH}/static-data/fairness-explainability.json`;
const CENTER: [number, number] = [-0.118, 51.509];

type FairnessMetric = "dependence" | "burden" | "mismatch";

interface LayerMeta {
  label: string;
  accent: string;
  description: string;
}

interface BoroughMetric {
  bucket: "Inner" | "Outer";
  activity_index: number;
  support_index: number;
  supply_change: number;
  dependence: number;
  support_score: number;
  burden: number;
  mismatch: number;
}

interface AudienceShiftItem {
  dimension: string;
  category: string;
  label: string;
  day_share: number;
  night_share: number;
  delta: number;
}

interface InnerOuterItem {
  metric: string;
  label: string;
  inner: number;
  outer: number;
}

interface HighlightItem {
  title: string;
  value: string;
  detail: string;
}

interface CommuteSnapshot {
  outer_to_outer: number;
  outer_to_inner: number;
  inner_to_inner: number;
  narrative: string;
}

interface FairnessExplainability {
  layerMeta: Record<FairnessMetric, LayerMeta>;
  boroughs: Record<string, BoroughMetric>;
  audienceShift: AudienceShiftItem[];
  innerOuter: InnerOuterItem[];
  commuteSnapshot: CommuteSnapshot;
  highlights: HighlightItem[];
  method: string[];
}

function clamp(value: number, low = 0, high = 1) {
  return Math.min(high, Math.max(low, value));
}

function interpolate(metric: FairnessMetric, value: number): string {
  const t = clamp(value);
  if (metric === "dependence") {
    const r = Math.round(28 + t * 64);
    const g = Math.round(58 + t * 110);
    const b = Math.round(92 + t * 120);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (metric === "burden") {
    const r = Math.round(75 + t * 155);
    const g = Math.round(38 + t * 48);
    const b = Math.round(48 + t * 52);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const r = Math.round(96 + t * 128);
  const g = Math.round(72 + t * 78);
  const b = Math.round(36 + t * 28);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function toSentenceCase(metric: FairnessMetric) {
  if (metric === "dependence") return "dependence";
  if (metric === "burden") return "burden";
  return "mismatch";
}

function mergeGeoWithMetric(
  geo: GeoJSON.FeatureCollection,
  boroughs: Record<string, BoroughMetric>,
  metric: FairnessMetric,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: geo.features.map((feature) => {
      const name = String(feature.properties?.name || "");
      const borough = boroughs[name];
      const score = borough?.[metric] ?? 0;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          score,
          fill_color: interpolate(metric, score),
          bucket: borough?.bucket || "Outer",
          dependence: borough?.dependence ?? 0,
          support_score: borough?.support_score ?? 0,
          burden: borough?.burden ?? 0,
          mismatch: borough?.mismatch ?? 0,
          supply_change: borough?.supply_change ?? 0,
          support_index: borough?.support_index ?? 0,
          activity_index: borough?.activity_index ?? 0,
        },
      };
    }),
  };
}

function AudienceShiftChart({ items }: { items: AudienceShiftItem[] }) {
  const width = 620;
  const rowHeight = 44;
  const height = items.length * rowHeight + 28;
  const left = 168;
  const right = width - 54;
  const maxValue = Math.max(...items.map((item) => Math.max(item.day_share, item.night_share)), 0.65);
  const scale = (value: number) => left + (value / maxValue) * (right - left);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="fairness-v2-svg">
      <text x={left} y={18} className="fairness-v2-axis-label">Day</text>
      <text x={right - 4} y={18} textAnchor="end" className="fairness-v2-axis-label">Night</text>
      {items.map((item, index) => {
        const y = 42 + index * rowHeight;
        const dayX = scale(item.day_share);
        const nightX = scale(item.night_share);
        const positive = item.delta >= 0;
        return (
          <g key={item.label}>
            <text x={0} y={y + 4} className="fairness-v2-row-label">{item.label}</text>
            <line
              x1={left}
              y1={y}
              x2={right}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <line
              x1={dayX}
              y1={y}
              x2={nightX}
              y2={y}
              stroke={positive ? "var(--accent-amber)" : "var(--accent-blue)"}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={dayX} cy={y} r="5" fill="var(--text-muted)" />
            <circle cx={nightX} cy={y} r="6" fill={positive ? "var(--accent-amber)" : "var(--accent-blue)"} />
            <text x={dayX} y={y - 10} textAnchor="middle" className="fairness-v2-value-label">
              {formatPct(item.day_share)}
            </text>
            <text x={nightX} y={y - 10} textAnchor="middle" className="fairness-v2-value-label">
              {formatPct(item.night_share)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function InnerOuterSlopeChart({ items }: { items: InnerOuterItem[] }) {
  const width = 520;
  const height = items.length * 62 + 30;
  const leftX = 150;
  const rightX = width - 74;
  const scale = (value: number) => height - 28 - value * (height - 72);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="fairness-v2-svg">
      <text x={leftX} y={20} textAnchor="middle" className="fairness-v2-axis-label">Inner</text>
      <text x={rightX} y={20} textAnchor="middle" className="fairness-v2-axis-label">Outer</text>
      {items.map((item, index) => {
        const yInner = scale(item.inner);
        const yOuter = scale(item.outer);
        const rowTop = 34 + index * 62;
        return (
          <g key={item.metric}>
            <text x={0} y={rowTop + 12} className="fairness-v2-row-label">{item.label}</text>
            <line x1={leftX} y1={rowTop + 6} x2={leftX} y2={rowTop + 52} stroke="rgba(255,255,255,0.08)" />
            <line x1={rightX} y1={rowTop + 6} x2={rightX} y2={rowTop + 52} stroke="rgba(255,255,255,0.08)" />
            <line x1={leftX} y1={yInner} x2={rightX} y2={yOuter} stroke="var(--champagne-gold)" strokeWidth="3" strokeLinecap="round" />
            <circle cx={leftX} cy={yInner} r="6" fill="var(--accent-blue)" />
            <circle cx={rightX} cy={yOuter} r="6" fill="var(--accent-rose)" />
            <text x={leftX} y={yInner - 10} textAnchor="middle" className="fairness-v2-value-label">{formatPct(item.inner)}</text>
            <text x={rightX} y={yOuter - 10} textAnchor="middle" className="fairness-v2-value-label">{formatPct(item.outer)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function BoroughRankingChart({
  rows,
  metric,
}: {
  rows: Array<[string, BoroughMetric]>;
  metric: FairnessMetric;
}) {
  const top = rows.slice(0, 8);
  const maxScore = Math.max(...top.map(([, value]) => value[metric]), 1);

  return (
    <div className="fairness-v2-ranking">
      {top.map(([name, value]) => (
        <div key={name} className="fairness-v2-ranking-row">
          <div>
            <div className="fairness-v2-ranking-name">{name}</div>
            <div className="fairness-v2-ranking-meta">{value.bucket} London</div>
          </div>
          <div className="fairness-v2-ranking-track">
            <div
              className="fairness-v2-ranking-fill"
              style={{
                width: `${(value[metric] / maxScore) * 100}%`,
                background: interpolate(metric, value[metric]),
              }}
            />
          </div>
          <div className="fairness-v2-ranking-value">{formatPct(value[metric])}</div>
        </div>
      ))}
    </div>
  );
}

export default function FairnessPanel() {
  const [data, setData] = useState<FairnessExplainability | null>(null);
  const [activeMetric, setActiveMetric] = useState<FairnessMetric>("mismatch");
  const [error, setError] = useState("");
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [ready, setReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    let stale = false;
    Promise.all([
      fetch(DATA_URL).then((response) => {
        if (!response.ok) throw new Error("Fairness explainability data missing");
        return response.json() as Promise<FairnessExplainability>;
      }),
      fetch(GEOJSON_URL).then((response) => {
        if (!response.ok) throw new Error("London borough boundary file missing");
        return response.json() as Promise<GeoJSON.FeatureCollection>;
      }),
    ])
      .then(([json, geo]) => {
        if (stale) return;
        setData(json);
        setGeojson(geo);
      })
      .catch((cause) => {
        if (!stale) setError(cause instanceof Error ? cause.message : "Could not load fairness data.");
      });
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: CENTER,
      zoom: 9.15,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("fairness-boroughs", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "fairness-fills",
        type: "fill",
        source: "fairness-boroughs",
        paint: {
          "fill-color": ["coalesce", ["get", "fill_color"], "rgba(60,70,90,0.5)"],
          "fill-opacity": 0.78,
        },
      });
      map.addLayer({
        id: "fairness-borders",
        type: "line",
        source: "fairness-boroughs",
        paint: {
          "line-color": "rgba(240,240,255,0.22)",
          "line-width": 1,
        },
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "fairness-popup",
      });
      map.on("mousemove", "fairness-fills", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const props = event.features?.[0]?.properties;
        if (!props) return;
        popup
          .setLngLat(event.lngLat)
          .setHTML(
            `<strong>${props.name}</strong><br/>` +
            `${props.bucket} London<br/>` +
            `${data?.layerMeta[activeMetric].label || "Score"}: ${Math.round(Number(props.score) * 100)}/100<br/>` +
            `Dependence ${Math.round(Number(props.dependence) * 100)} · Support ${Math.round(Number(props.support_score) * 100)}<br/>` +
            `Burden ${Math.round(Number(props.burden) * 100)} · Mismatch ${Math.round(Number(props.mismatch) * 100)}`
          )
          .addTo(map);
      });
      map.on("mouseleave", "fairness-fills", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [activeMetric, data]);

  useEffect(() => {
    if (!ready || !mapRef.current || !geojson || !data) return;
    const source = mapRef.current.getSource("fairness-boroughs") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(mergeGeoWithMetric(geojson, data.boroughs, activeMetric));
  }, [activeMetric, data, geojson, ready]);

  if (error) {
    return (
      <div className="fairness-v2-wrap">
        <div className="fairness-v2-error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fairness-v2-wrap">
        <div className="fairness-v2-loading">Loading fairness explainability...</div>
      </div>
    );
  }

  const metricRows = Object.entries(data.boroughs).sort(
    (left, right) => right[1][activeMetric] - left[1][activeMetric],
  );
  const activeMeta = data.layerMeta[activeMetric];

  return (
    <div className="fairness-v2-wrap">
      <section className="fairness-v2-hero">
        <p className="section-label">Fairness and explainability</p>
        <h1 className="fairness-v2-title">
          Who depends on the night network, and where does the burden land?
        </h1>
        <p className="fairness-v2-subtitle">
          This view focuses on dependence, burden, centre-periphery asymmetry, and dependence-support mismatch.
          Lighting is intentionally left out of this page.
        </p>
      </section>

      <section className="fairness-v2-highlights">
        {data.highlights.map((item) => (
          <div key={item.title} className="fairness-v2-highlight-card">
            <div className="fairness-v2-highlight-title">{item.title}</div>
            <div className="fairness-v2-highlight-value">{item.value}</div>
            <p className="fairness-v2-highlight-detail">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="fairness-v2-map-shell">
        <div className="fairness-v2-sidebar">
          <h2 className="fairness-v2-panel-title">Borough map</h2>
          <p className="fairness-v2-panel-copy">
            Switch the borough layer to see where demand proxies stay high, where the composite burden is heavier, and where support appears to lag behind dependence.
          </p>
          <div className="fairness-v2-toggle-group">
            {(["mismatch", "burden", "dependence"] as FairnessMetric[]).map((metric) => {
              const meta = data.layerMeta[metric];
              const active = metric === activeMetric;
              return (
                <button
                  key={metric}
                  type="button"
                  className={`fairness-v2-toggle ${active ? "active" : ""}`}
                  onClick={() => setActiveMetric(metric)}
                  style={active ? { borderColor: meta.accent, color: meta.accent } : undefined}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="fairness-v2-layer-copy">
            <div className="fairness-v2-layer-heading">{activeMeta.label}</div>
            <p>{activeMeta.description}</p>
          </div>
          <div className="fairness-v2-method-list">
            {data.method.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className="fairness-v2-map-stage">
          <div ref={mapContainerRef} className="fairness-map-container" />
          <div className="fairness-v2-legend">
            <div className="fairness-v2-legend-title">{activeMeta.label}</div>
            <div className="fairness-v2-legend-bar">
              <span style={{ background: interpolate(activeMetric, 0.08) }} />
              <span style={{ background: interpolate(activeMetric, 0.33) }} />
              <span style={{ background: interpolate(activeMetric, 0.58) }} />
              <span style={{ background: interpolate(activeMetric, 0.82) }} />
            </div>
            <div className="fairness-v2-legend-labels">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fairness-v2-grid">
        <article className="fairness-v2-card">
          <div className="fairness-v2-card-header">
            <h3>Who relies more on the night network?</h3>
            <p>Night bus use shifts most for these groups when compared with daytime composition.</p>
          </div>
          <AudienceShiftChart items={data.audienceShift} />
        </article>

        <article className="fairness-v2-card">
          <div className="fairness-v2-card-header">
            <h3>Centre-periphery asymmetry</h3>
            <p>Inner and outer boroughs carry different mixes of dependence, support, burden, and mismatch.</p>
          </div>
          <InnerOuterSlopeChart items={data.innerOuter} />
          <p className="fairness-v2-note">{data.commuteSnapshot.narrative}</p>
        </article>
      </section>

      <section className="fairness-v2-grid fairness-v2-grid-single">
        <article className="fairness-v2-card">
          <div className="fairness-v2-card-header">
            <h3>Which boroughs carry the heaviest {toSentenceCase(activeMetric)}?</h3>
            <p>Top boroughs for the currently selected layer, using the same score that drives the map.</p>
          </div>
          <BoroughRankingChart rows={metricRows} metric={activeMetric} />
        </article>
      </section>

      <p className="fairness-v2-disclaimer">
        These indices are explanatory composites built from support intensity, activity, supply change, and travel-pattern proxies.
        They help compare where the night network feels more consequential, but they do not establish causality or personal risk.
      </p>
    </div>
  );
}
