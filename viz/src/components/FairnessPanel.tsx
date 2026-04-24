"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoibGV2aW5lbGl1IiwiYSI6ImNta21vc3doOTBleGYza3IycDNsOXRidXQifQ.SdtOnvfZEml6QGLmnnduDQ";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const GEOJSON_URL = `${BASE_PATH}/london-boroughs.geojson`;
const DATA_URL = `${BASE_PATH}/static-data/fairness-explainability.json`;
const CENTER: [number, number] = [-0.118, 51.509];

type FairnessMetric =
  | "mismatch_hotspots"
  | "activity_footprint"
  | "support_coverage";

interface LayerMeta {
  label: string;
  accent: string;
  description: string;
}

interface BoroughMetric {
  bucket: "Inner" | "Outer";
  msoa_count: number;
  activity_index_mean: number;
  support_index_mean: number;
  supply_change_mean: number;
  supply_change_spread: number;
  activity_footprint: number;
  activity_footprint_count: number;
  support_coverage: number;
  support_coverage_count: number;
  mismatch_hotspots: number;
  mismatch_hotspots_count: number;
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
  thresholds: Record<string, number>;
  boroughs: Record<string, BoroughMetric>;
  audienceShift: AudienceShiftItem[];
  innerOuter: InnerOuterItem[];
  commuteSnapshot: CommuteSnapshot;
  highlights: HighlightItem[];
  method: string[];
}

interface MetricScale {
  breaks: number[];
  min: number;
  max: number;
}

const METRIC_ORDER: FairnessMetric[] = [
  "mismatch_hotspots",
  "activity_footprint",
  "support_coverage",
];

const METRIC_COUNT_KEYS: Record<
  FairnessMetric,
  keyof BoroughMetric
> = {
  mismatch_hotspots: "mismatch_hotspots_count",
  activity_footprint: "activity_footprint_count",
  support_coverage: "support_coverage_count",
};

const METRIC_PALETTES: Record<FairnessMetric, string[]> = {
  mismatch_hotspots: [
    "#3e3220",
    "#72572a",
    "#a67b2e",
    "#c9a96e",
    "#f1d8a6",
  ],
  activity_footprint: [
    "#1d3445",
    "#30506b",
    "#467394",
    "#66a1c4",
    "#a8d6ee",
  ],
  support_coverage: [
    "#11362e",
    "#1d5b4d",
    "#2e7a65",
    "#4ea387",
    "#9cd4b9",
  ],
};

function clamp(value: number, low = 0, high = 1) {
  return Math.min(high, Math.max(low, value));
}

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function quantileBreaks(values: number[]): MetricScale {
  const sorted = [...values].sort((left, right) => left - right);
  const pick = (quantile: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * quantile))] ?? 0;

  return {
    breaks: [pick(0.2), pick(0.4), pick(0.6), pick(0.8)],
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

function steppedColor(metric: FairnessMetric, value: number, scale: MetricScale) {
  const palette = METRIC_PALETTES[metric];
  let index = scale.breaks.findIndex((threshold) => value <= threshold);
  if (index === -1) index = palette.length - 1;
  return palette[Math.min(index, palette.length - 1)];
}

function mergeGeoWithMetric(
  geo: GeoJSON.FeatureCollection,
  boroughs: Record<string, BoroughMetric>,
  metric: FairnessMetric,
  scale: MetricScale,
): GeoJSON.FeatureCollection {
  const countKey = METRIC_COUNT_KEYS[metric];
  return {
    type: "FeatureCollection",
    features: geo.features.map((feature) => {
      const name = String(feature.properties?.name || "");
      const borough = boroughs[name];
      const score = borough?.[metric] ?? 0;
      const count = borough?.[countKey] ?? 0;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          score,
          count,
          fill_color: steppedColor(metric, score, scale),
          bucket: borough?.bucket || "Outer",
          msoa_count: borough?.msoa_count ?? 0,
          activity_index_mean: borough?.activity_index_mean ?? 0,
          support_index_mean: borough?.support_index_mean ?? 0,
          supply_change_mean: borough?.supply_change_mean ?? 0,
          supply_change_spread: borough?.supply_change_spread ?? 0,
          activity_footprint: borough?.activity_footprint ?? 0,
          support_coverage: borough?.support_coverage ?? 0,
          mismatch_hotspots: borough?.mismatch_hotspots ?? 0,
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
  const maxValue = Math.max(
    ...items.map((item) => Math.max(item.day_share, item.night_share)),
    0.65,
  );
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
  const countKey = METRIC_COUNT_KEYS[metric];

  return (
    <div className="fairness-v2-ranking">
      {top.map(([name, value]) => (
        <div key={name} className="fairness-v2-ranking-row">
          <div>
            <div className="fairness-v2-ranking-name">{name}</div>
            <div className="fairness-v2-ranking-meta">
              {value.bucket} London · {value[countKey]}/{value.msoa_count} MSOAs
            </div>
          </div>
          <div className="fairness-v2-ranking-track">
            <div
              className="fairness-v2-ranking-fill"
              style={{
                width: `${(value[metric] / maxScore) * 100}%`,
                background: steppedColor(metric, value[metric], {
                  breaks: [maxScore * 0.2, maxScore * 0.4, maxScore * 0.6, maxScore * 0.8],
                  min: 0,
                  max: maxScore,
                }),
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
  const [activeMetric, setActiveMetric] = useState<FairnessMetric>("mismatch_hotspots");
  const [error, setError] = useState("");
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [ready, setReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const activeMetricRef = useRef<FairnessMetric>(activeMetric);
  const dataRef = useRef<FairnessExplainability | null>(data);
  const scalesRef = useRef<Record<FairnessMetric, MetricScale> | null>(null);

  useEffect(() => {
    activeMetricRef.current = activeMetric;
  }, [activeMetric]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

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
        if (!stale) {
          setError(cause instanceof Error ? cause.message : "Could not load fairness data.");
        }
      });
    return () => {
      stale = true;
    };
  }, []);

  const metricScales = useMemo(() => {
    if (!data) return null;
    const boroughValues = Object.values(data.boroughs);
    return {
      mismatch_hotspots: quantileBreaks(
        boroughValues.map((borough) => borough.mismatch_hotspots),
      ),
      activity_footprint: quantileBreaks(
        boroughValues.map((borough) => borough.activity_footprint),
      ),
      support_coverage: quantileBreaks(
        boroughValues.map((borough) => borough.support_coverage),
      ),
    } satisfies Record<FairnessMetric, MetricScale>;
  }, [data]);

  useEffect(() => {
    scalesRef.current = metricScales;
  }, [metricScales]);

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
          "fill-opacity": 0.84,
        },
      });
      map.addLayer({
        id: "fairness-borders",
        type: "line",
        source: "fairness-boroughs",
        paint: {
          "line-color": "rgba(240,240,255,0.26)",
          "line-width": 1,
        },
      });

      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "fairness-popup",
      });

      map.on("mousemove", "fairness-fills", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const props = event.features?.[0]?.properties;
        if (!props || !popupRef.current) return;

        const currentMetric = activeMetricRef.current;
        const currentData = dataRef.current;
        const label = currentData?.layerMeta[currentMetric].label || "Score";
        const count = Number(props.count) || 0;
        const total = Number(props.msoa_count) || 0;
        const note = total === 1 ? " · single MSOA borough" : "";

        popupRef.current
          .setLngLat(event.lngLat)
          .setHTML(
            `<strong>${props.name}</strong><br/>` +
            `${props.bucket} London · ${total} MSOAs${note}<br/>` +
            `${label}: ${Math.round(Number(props.score) * 100)}% (${count}/${total})<br/>` +
            `Night footprint ${Math.round(Number(props.activity_footprint) * 100)}% · ` +
            `Support coverage ${Math.round(Number(props.support_coverage) * 100)}%<br/>` +
            `Mismatch hotspots ${Math.round(Number(props.mismatch_hotspots) * 100)}%<br/>` +
            `Mean support index ${Number(props.support_index_mean).toFixed(2)} · ` +
            `Supply change ${Number(props.supply_change_mean).toFixed(2)}`
          )
          .addTo(map);
      });

      map.on("mouseleave", "fairness-fills", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      setReady(true);
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !geojson || !data || !metricScales) return;
    const source = mapRef.current.getSource("fairness-boroughs") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(mergeGeoWithMetric(geojson, data.boroughs, activeMetric, metricScales[activeMetric]));
  }, [activeMetric, data, geojson, metricScales, ready]);

  if (error) {
    return (
      <div className="fairness-v2-wrap">
        <div className="fairness-v2-error">{error}</div>
      </div>
    );
  }

  if (!data || !metricScales) {
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
  const activeScale = metricScales[activeMetric];
  const thresholdText =
    activeMetric === "activity_footprint"
      ? `Threshold: activity_index >= ${data.thresholds.activity_footprint_min.toFixed(2)}`
      : activeMetric === "support_coverage"
        ? `Threshold: support_index >= ${data.thresholds.support_coverage_min.toFixed(2)}`
        : `Threshold: activity_index >= ${data.thresholds.mismatch_activity_min.toFixed(2)} and support_index <= ${data.thresholds.mismatch_support_max.toFixed(2)}`;

  return (
    <div className="fairness-v2-wrap">
      <section className="fairness-v2-hero">
        <p className="section-label">Fairness and explainability</p>
        <h1 className="fairness-v2-title">
          Where does late-night need stay visible, and where does support fall behind?
        </h1>
        <p className="fairness-v2-subtitle">
          The borough map now uses share-based indicators instead of borough-wide means,
          so outer-London differences do not get flattened by central outliers.
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
            Each layer measures the share of MSOAs inside a borough that meet a specific
            after-dark condition. This surfaces internal borough structure instead of
            compressing everything into one average.
          </p>
          <div className="fairness-v2-toggle-group">
            {METRIC_ORDER.map((metric) => {
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
            <p>{thresholdText}</p>
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
              {METRIC_PALETTES[activeMetric].map((color) => (
                <span key={color} style={{ background: color }} />
              ))}
            </div>
            <div className="fairness-v2-legend-labels">
              <span>{formatPct(clamp(activeScale.min))}</span>
              <span>{formatPct(clamp((activeScale.min + activeScale.max) / 2))}</span>
              <span>{formatPct(clamp(activeScale.max))}</span>
            </div>
            <p className="fairness-v2-note">
              Quantile-scaled colors keep non-central borough differences legible.
            </p>
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
            <h3>Inner and outer boroughs diverge differently</h3>
            <p>Inner London keeps a stronger night footprint, while outer London carries more mismatch hotspots.</p>
          </div>
          <InnerOuterSlopeChart items={data.innerOuter} />
          <p className="fairness-v2-note">{data.commuteSnapshot.narrative}</p>
        </article>
      </section>

      <section className="fairness-v2-grid fairness-v2-grid-single">
        <article className="fairness-v2-card">
          <div className="fairness-v2-card-header">
            <h3>Which boroughs score highest on {activeMeta.label.toLowerCase()}?</h3>
            <p>Ranking uses the same borough-share metric as the map, so the top list and the choropleth tell the same story.</p>
          </div>
          <BoroughRankingChart rows={metricRows} metric={activeMetric} />
        </article>
      </section>

      <p className="fairness-v2-disclaimer">
        These layers are explanatory spatial proxies built from processed MSOA support and activity data, plus borough-level supply change context.
        They help compare where late-night conditions thin out unevenly, but they are not measures of personal safety or lived experience on their own.
      </p>
    </div>
  );
}
