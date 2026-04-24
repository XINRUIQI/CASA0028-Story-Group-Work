"use client";

import { Footprints, Clock, Train, Bus, ArrowLeftRight } from "lucide-react";
import type { Leg } from "@/lib/api";

interface JourneyTimelineProps {
  legs: Leg[];
  totalDuration: number;
  label: string;
  accent?: string;
}

function segmentColor(leg: Leg): string {
  if (leg.is_walking) return "var(--accent-amber)";
  if (leg.mode_id === "bus") return "var(--accent-emerald)";
  return "var(--champagne-gold)";
}

function segmentIcon(leg: Leg) {
  if (leg.is_walking) return <Footprints size={12} />;
  if (leg.mode_id === "bus") return <Bus size={12} />;
  return <Train size={12} />;
}

export default function JourneyTimeline({
  legs,
  totalDuration,
  label,
  accent = "var(--champagne-gold)",
}: JourneyTimelineProps) {
  if (!legs.length) return null;

  const safeDuration = Math.max(totalDuration, 1);

  return (
    <div className="timeline-wrap">
      <div className="timeline-label" style={{ color: accent }}>
        {label}
      </div>
      <div className="timeline-total">
        <Clock size={12} /> {totalDuration} min total
      </div>
      <div className="timeline-bar">
        {legs.map((leg, i) => {
          const widthPct = Math.max((leg.duration_min / safeDuration) * 100, 3);
          return (
            <div
              key={i}
              className="timeline-segment"
              style={{
                width: `${widthPct}%`,
                background: segmentColor(leg),
              }}
              title={`${leg.is_walking ? "Walk" : leg.mode} · ${leg.duration_min} min`}
            >
              {widthPct > 8 && (
                <span className="timeline-seg-icon">{segmentIcon(leg)}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="timeline-stops">
        {legs.map((leg, i) => {
          const widthPct = Math.max((leg.duration_min / safeDuration) * 100, 3);
          const showLabel = widthPct > 12;
          return (
            <div key={i} className="timeline-stop" style={{ width: `${widthPct}%` }}>
              {showLabel && (
                <span className="timeline-stop-name">
                  {leg.is_walking
                    ? `${leg.duration_min}m walk`
                    : leg.departure_point.name.split(/[,(]/)[0].trim()}
                </span>
              )}
              {!leg.is_walking && i > 0 && legs[i - 1]?.is_walking && (
                <ArrowLeftRight size={10} className="timeline-transfer-icon" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
