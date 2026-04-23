"use client";

import { useState, useEffect } from "react";
import { api, type CompareHourlyResult } from "@/lib/api";

interface HourlyPoint {
  duration_min: number | null;
  waiting_time: number | null;
  support_nearby: number | null;
  service_uncertainty: number | null;
  safety: number | null;
}

interface HourlyCurvesProps {
  origin: string;
  destination: string;
  highlightMetrics?: string[];
}

const HOURLY_TIMES = [
  "06:00",
  "09:00",
  "12:00",
  "15:00",
  "18:00",
  "21:00",
  "24:00",
  "03:00",
] as const;

const CHART_WIDTH = 760;
const CHART_HEIGHT = 148;
const CHART_PADDING = { top: 20, right: 22, bottom: 30, left: 44 } as const;
const CHART_INNER_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
const CHART_INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

const METRICS: {
  key: keyof HourlyPoint;
  label: string;
  unit: string;
  color: string;
  highlightKey: string;
}[] = [
  { key: "duration_min", label: "Total time", unit: "min", color: "var(--champagne-gold)", highlightKey: "duration" },
  { key: "waiting_time", label: "Waiting time", unit: "min", color: "var(--accent-rose)", highlightKey: "waiting" },
  { key: "support_nearby", label: "Support nearby", unit: "places", color: "var(--accent-emerald)", highlightKey: "support" },
  { key: "service_uncertainty", label: "Service uncertainty", unit: "%", color: "var(--accent-amber)", highlightKey: "uncertainty" },
  { key: "safety", label: "Safety", unit: "%", color: "var(--accent-blue)", highlightKey: "safety" },
];

async function loadStaticHourlyCurves(origin: string, destination: string) {
  const encodedTimes = HOURLY_TIMES.join(",").replace(/:/g, "-").replace(/,/g, "_");
  const path = `/static-data/compare-hourly/${destination}__${origin}__${encodedTimes}.json`;
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return (await response.json()) as CompareHourlyResult;
  } catch {
    return null;
  }
}

function formatHourLabel(time: string): string {
  return time === "24:00" ? "24" : time.slice(0, 2);
}

function formatMetricValue(value: number | null, unit: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (unit === "min") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }
  if (unit === "%") {
    return `${Math.round(value)}`;
  }
  return `${Math.round(value)}`;
}

function buildHourlyCurves(
  source: CompareHourlyResult["curves"],
): Record<string, HourlyPoint | null> {
  const curves: Record<string, HourlyPoint | null> = {};

  for (const time of HOURLY_TIMES) {
    const point = source[time];
    if (!point) {
      curves[time] = null;
      continue;
    }

    curves[time] = {
      duration_min: Number(point.duration_min ?? 0),
      waiting_time: Number(point.waiting_burden ?? 0),
      support_nearby: Number(point.support_open ?? 0),
      service_uncertainty: point.uncertainty_score_pct,
      safety: point.safety_score_pct,
    };
  }

  return curves;
}

function makeLinePath(points: Array<[number, number] | null>): string {
  let path = "";
  let drawing = false;

  for (const point of points) {
    if (!point) {
      drawing = false;
      continue;
    }
    path += `${drawing ? " L" : "M"} ${point[0]},${point[1]}`;
    drawing = true;
  }

  return path.trim();
}

export default function HourlyCurves({
  origin,
  destination,
  highlightMetrics = [],
}: HourlyCurvesProps) {
  const [curves, setCurves] = useState<Record<string, HourlyPoint | null>>({});
  const [resolvedKey, setResolvedKey] = useState("");
  const requestKey = origin && destination ? `${origin}|${destination}` : "";
  const loading = !!requestKey && requestKey !== resolvedKey;

  function mergeCurveSources(
    live: CompareHourlyResult | null,
    fallback: CompareHourlyResult | null,
  ): Record<string, HourlyPoint | null> {
    const source: CompareHourlyResult["curves"] = {};

    for (const time of HOURLY_TIMES) {
      source[time] = live?.curves?.[time] ?? fallback?.curves?.[time] ?? null;
    }

    return buildHourlyCurves(source);
  }

  useEffect(() => {
    if (!origin || !destination) return;
    let stale = false;

    loadStaticHourlyCurves(origin, destination)
      .then((fallback) => {
        if (stale) return;

        if (fallback) {
          setCurves(buildHourlyCurves(fallback.curves));
          setResolvedKey(requestKey);
        }

        return api.compareHourly(origin, destination, [...HOURLY_TIMES])
          .then((live) => {
            if (stale) return;
            setCurves(mergeCurveSources(live, fallback));
            setResolvedKey(requestKey);
          })
          .catch(() => {
            if (!stale && !fallback) {
              setCurves({});
              setResolvedKey(requestKey);
            }
          });
      })
      .catch(() => {
        if (!stale) {
          setCurves({});
          setResolvedKey(requestKey);
        }
      });

    return () => { stale = true; };
  }, [origin, destination, requestKey]);

  if (loading) {
    return (
      <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        Loading hourly data...
      </p>
    );
  }

  if (HOURLY_TIMES.every((time) => curves[time] == null)) {
    return (
      <p className="text-center py-8" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
        Hourly data not available. Start the backend to enable live queries.
      </p>
    );
  }

  return (
    <div className="hourly-curves">
      {METRICS.map((m) => {
        const values = HOURLY_TIMES
          .map((time) => curves[time]?.[m.key] ?? null)
          .filter((value): value is number => value != null && Number.isFinite(value));
        const minValue = values.length > 0 ? Math.min(...values) : 0;
        const maxValue = values.length > 0 ? Math.max(...values) : 1;
        const range = maxValue - minValue || 1;
        const isHighlighted = highlightMetrics.includes(m.highlightKey);
        const points = HOURLY_TIMES.map((time, index) => {
          const value = curves[time]?.[m.key] ?? null;
          if (value == null || !Number.isFinite(value)) return null;
          const x = CHART_PADDING.left + (index / Math.max(HOURLY_TIMES.length - 1, 1)) * CHART_INNER_WIDTH;
          const y = CHART_PADDING.top + (1 - (value - minValue) / range) * CHART_INNER_HEIGHT;
          return [x, y] as [number, number];
        });
        const yTicks = [minValue, minValue + range / 2, maxValue];

        return (
          <div
            key={m.key}
            className={`hourly-curve-row ${isHighlighted ? "highlighted" : ""}`}
          >
            <div className="hourly-curve-header">
              <div className="hourly-label">
                <span className="hourly-dot" style={{ background: m.color }} />
                <span>{m.label}</span>
              </div>
              <div className="hourly-curve-range">
                <span>{formatMetricValue(minValue, m.unit)}</span>
                <span>to</span>
                <span>{formatMetricValue(maxValue, m.unit)}</span>
                <span>{m.unit}</span>
              </div>
            </div>
            <div className="hourly-curve-scroll">
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="hourly-curve-svg">
                {HOURLY_TIMES.map((time, index) => {
                  const x = CHART_PADDING.left + (index / Math.max(HOURLY_TIMES.length - 1, 1)) * CHART_INNER_WIDTH;
                  return (
                    <line
                      key={time}
                      x1={x}
                      y1={CHART_PADDING.top}
                      x2={x}
                      y2={CHART_PADDING.top + CHART_INNER_HEIGHT}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />
                  );
                })}

                {yTicks.map((tick, index) => {
                  const y = CHART_PADDING.top + (1 - (tick - minValue) / range) * CHART_INNER_HEIGHT;
                  return (
                    <g key={index}>
                      <line
                        x1={CHART_PADDING.left}
                        y1={y}
                        x2={CHART_PADDING.left + CHART_INNER_WIDTH}
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                      />
                      <text
                        x={CHART_PADDING.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="hourly-curve-axis-label"
                      >
                        {formatMetricValue(tick, m.unit)}
                      </text>
                    </g>
                  );
                })}

                <path
                  d={makeLinePath(points)}
                  fill="none"
                  stroke={m.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {points.map((point, index) => {
                  const value = curves[HOURLY_TIMES[index]]?.[m.key] ?? null;
                  if (!point || value == null || !Number.isFinite(value)) return null;
                  return (
                    <g key={HOURLY_TIMES[index]}>
                      <circle cx={point[0]} cy={point[1]} r="4" fill={m.color} />
                      <text
                        x={point[0]}
                        y={Math.max(CHART_PADDING.top - 2, point[1] - 10)}
                        textAnchor="middle"
                        className="hourly-curve-point-label"
                      >
                        {formatMetricValue(value, m.unit)}
                      </text>
                      <text
                        x={point[0]}
                        y={CHART_HEIGHT - 8}
                        textAnchor="middle"
                        className="hourly-curve-axis-label"
                      >
                        {formatHourLabel(HOURLY_TIMES[index])}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
