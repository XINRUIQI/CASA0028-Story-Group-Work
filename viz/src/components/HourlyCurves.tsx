"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface HourlyPoint {
  duration_min: number;
  waiting_burden: number;
  wait_share: number;
  support_open: number;
  support_ratio: number | null;
  max_recovery_penalty_min: number;
}

interface HourlyCurvesProps {
  origin: string;
  destination: string;
  /** Which metric rows to highlight (persona focus) */
  highlightMetrics?: string[];
}

const METRICS: {
  key: keyof HourlyPoint;
  label: string;
  unit: string;
  color: string;
  higherIsWorse: boolean;
}[] = [
  { key: "waiting_burden", label: "Expected wait", unit: "min", color: "var(--accent-rose)", higherIsWorse: true },
  { key: "support_open", label: "Open support POIs", unit: "", color: "var(--accent-emerald)", higherIsWorse: false },
  { key: "max_recovery_penalty_min", label: "Max missed-connection penalty", unit: "min", color: "var(--accent-amber)", higherIsWorse: true },
  { key: "duration_min", label: "Total journey time", unit: "min", color: "var(--champagne-gold)", higherIsWorse: true },
];

export default function HourlyCurves({
  origin,
  destination,
  highlightMetrics = [],
}: HourlyCurvesProps) {
  const [curves, setCurves] = useState<Record<string, HourlyPoint | null>>({});
  const [fetchedFor, setFetchedFor] = useState<string>("");
  const loading = !!(origin && destination) && `${origin}|${destination}` !== fetchedFor;

  useEffect(() => {
    if (!origin || !destination) return;
    let stale = false;
    const key = `${origin}|${destination}`;
    api
      .compareCards(origin, destination, [
        "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:00",
      ])
      .then((res) => {
        if (stale) return;
        const pts: Record<string, HourlyPoint | null> = {};
        for (const [t, opt] of Object.entries(res.options)) {
          if (!opt) { pts[t] = null; continue; }
          const c = opt.cards;
          pts[t] = {
            duration_min: Number(c.functional_cost?.total_duration_min ?? 0),
            waiting_burden: Number(c.waiting_burden?.total_expected_wait_min ?? 0),
            wait_share: Number(c.waiting_burden?.wait_share_of_journey ?? 0),
            support_open: Number(c.support_access?.total_support_open ?? 0),
            support_ratio: c.support_access?.support_open_ratio != null
              ? Number(c.support_access.support_open_ratio)
              : null,
            max_recovery_penalty_min: Number(c.service_uncertainty?.mean_headway_gap_ratio ?? 0) * 5,
          };
        }
        setCurves(pts);
        setFetchedFor(key);
      })
      .catch(() => { if (!stale) { setCurves({}); setFetchedFor(key); } });
    return () => { stale = true; };
  }, [origin, destination]);

  if (loading) {
    return (
      <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        Loading hourly data...
      </p>
    );
  }

  const hours = Object.keys(curves).sort();
  if (hours.length === 0) {
    return (
      <p className="text-center py-8" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
        Hourly data not available. Start the backend to enable live queries.
      </p>
    );
  }

  return (
    <div className="hourly-curves">
      {METRICS.map((m) => {
        const values = hours.map((h) => curves[h]?.[m.key] ?? null).filter((v): v is number => v !== null);
        const maxVal = Math.max(...values, 1);
        const isHighlighted = highlightMetrics.some(
          (hm) => m.key.includes(hm) || m.label.toLowerCase().includes(hm),
        );

        return (
          <div
            key={m.key}
            className={`hourly-row ${isHighlighted ? "highlighted" : ""}`}
          >
            <div className="hourly-label">
              <span className="hourly-dot" style={{ background: m.color }} />
              <span>{m.label}</span>
            </div>
            <div className="hourly-bars">
              {hours.map((h) => {
                const val = curves[h]?.[m.key];
                if (val == null) {
                  return (
                    <div key={h} className="hourly-bar-cell">
                      <div className="hourly-bar-time">{h}</div>
                      <div className="hourly-bar-track">
                        <div className="hourly-bar-fill empty" />
                      </div>
                    </div>
                  );
                }
                const pct = Math.max((Number(val) / maxVal) * 100, 4);
                return (
                  <div key={h} className="hourly-bar-cell">
                    <div className="hourly-bar-time">{h}</div>
                    <div className="hourly-bar-track">
                      <div
                        className="hourly-bar-fill"
                        style={{ height: `${pct}%`, background: m.color }}
                      />
                    </div>
                    <div className="hourly-bar-val">
                      {Number(val).toFixed(m.key === "support_open" ? 0 : 1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
