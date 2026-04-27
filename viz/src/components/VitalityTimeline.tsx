"use client";

import { useMemo } from "react";

/* ── Composite City Vitality Density Index ──────────────────────
 * Formula:  0.30 × service_freq
 *         + 0.30 × support_access
 *         + 0.20 × service_certainty
 *         + 0.20 × safety_visibility
 *
 * Averaged across 5 representative London routes.
 * See /public/static-data/city-vitality.json for methodology.
 * ────────────────────────────────────────────────────────────── */

const VITALITY = [
  { time: "09", hour: 9,  density: 0.91, color: "#f0b87a" },
  { time: "12", hour: 12, density: 0.88, color: "#e8b270" },
  { time: "15", hour: 15, density: 0.87, color: "#dca858" },
  { time: "18", hour: 18, density: 0.90, color: "#c9a05c" },
  { time: "21", hour: 21, density: 0.64, color: "#8a7a5a" },
  { time: "01", hour: 1,  density: 0.35, color: "#5a554a" },
] as const;

const MAX_DOTS = 100;

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface DotData {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
}

interface ColData {
  time: string;
  hour: number;
  density: number;
  color: string;
  count: number;
  dots: DotData[];
}

function buildColumns(): ColData[] {
  return VITALITY.map((v, ci) => {
    const count = Math.round(Math.pow(v.density, 1.4) * MAX_DOTS);
    const dots: DotData[] = Array.from({ length: count }, (_, di) => {
      const seed = ci * 997 + di * 13;
      return {
        x: sr(seed + 1) * 88 + 6,
        y: sr(seed + 2) * 84 + 8,
        size: 1.2 + sr(seed + 3) * 2.6 * Math.sqrt(v.density),
        opacity: 0.1 + sr(seed + 4) * 0.7 * v.density,
        delay: sr(seed + 5) * 6,
        duration: 3 + sr(seed + 6) * 4,
      };
    });
    return { ...v, count, dots };
  });
}

const STATIC_COLUMNS = buildColumns();

export default function VitalityTimeline() {
  const columns = useMemo(() => STATIC_COLUMNS, []);

  return (
    <section className="vt-section">
      <div className="vt-inner">
        <p className="vt-section-label">Composite City Vitality Index</p>
        <h2 className="vt-heading">
          The city doesn&rsquo;t just get darker &mdash; it empties out
        </h2>

        <div className="vt-timeline">
          {columns.map((col) => (
            <div key={col.time} className="vt-col">
              {/* Dot field */}
              <div className="vt-field">
                {col.dots.map((dot, i) => (
                  <span
                    key={i}
                    className="vt-dot"
                    style={{
                      left: `${dot.x}%`,
                      top: `${dot.y}%`,
                      width: dot.size,
                      height: dot.size,
                      backgroundColor: col.color,
                      boxShadow: `0 0 ${dot.size * 2.5}px ${col.color}`,
                      opacity: dot.opacity,
                      animationDelay: `${dot.delay}s`,
                      animationDuration: `${dot.duration}s`,
                    }}
                  />
                ))}
              </div>

              {/* Label */}
              <div className="vt-label">
                <span className="vt-time">{col.time}:00</span>
                <span className="vt-score" style={{ color: col.color }}>
                  {Math.round(col.density * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="vt-formula">
          0.30 × Service frequency &nbsp;·&nbsp; 0.30 × Support access
          &nbsp;·&nbsp; 0.20 × Service certainty &nbsp;·&nbsp; 0.20 × Safety
          visibility
        </p>
        <p className="vt-note">
          Averaged across 5 representative London routes
        </p>
      </div>
    </section>
  );
}
