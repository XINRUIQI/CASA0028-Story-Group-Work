"use client";

/**
 * Animated grid of dots representing the transit network.
 * As the time band shifts to night, dots fade and change colour,
 * visualising how service thins out after dark.
 */

import type { TimeBand } from "@/components/DayNightToggle";

const COLS = 16;
const ROWS = 8;
const TOTAL = COLS * ROWS;

function seeded(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface ServiceGridProps {
  band: TimeBand;
  activeColor?: string;
}

export default function ServiceGrid({ band, activeColor }: ServiceGridProps) {
  const activeRatio = band === "daytime" ? 1 : band === "evening" ? 0.7 : 0.3;
  const dotColor =
    activeColor ??
    (band === "daytime"
      ? "var(--accent-amber)"
      : band === "evening"
        ? "var(--champagne-gold)"
        : "var(--champagne-gold)");

  return (
    <div className="service-grid-wrap">
      <div className="service-grid">
        {Array.from({ length: TOTAL }, (_, i) => {
          const r = seeded(i);
          const active = r < activeRatio;
          return (
            <span
              key={i}
              className="service-dot"
              style={{
                opacity: active ? 0.7 : 0.08,
                background: active ? dotColor : "var(--text-muted)",
                transitionDelay: `${(seeded(i + 200) * 0.6).toFixed(3)}s`,
              }}
            />
          );
        })}
      </div>
      <div className="service-grid-legend">
        <span className="service-grid-legend-dot" style={{ background: dotColor, opacity: 0.7 }} />
        <span>Active service point</span>
        <span className="service-grid-legend-dot" style={{ background: "var(--text-muted)", opacity: 0.15 }} />
        <span>Inactive</span>
      </div>
    </div>
  );
}
