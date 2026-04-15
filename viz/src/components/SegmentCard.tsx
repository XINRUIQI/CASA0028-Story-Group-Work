"use client";

import { Leg, SupportCard } from "@/lib/api";
import { Footprints, Clock, Train, Bus } from "lucide-react";

interface SegmentCardProps {
  index: number;
  leg: Leg;
  support?: SupportCard;
}

function getSegmentLabel(leg: Leg): string {
  if (leg.is_walking) {
    if (leg.summary.toLowerCase().includes("final")) return "Final walk";
    return "Walk to stop";
  }
  return leg.mode;
}

function getSegmentIcon(leg: Leg) {
  if (leg.is_walking) return <Footprints size={16} />;
  if (leg.mode_id === "bus") return <Bus size={16} />;
  return <Train size={16} />;
}

function Badge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "gray" }) {
  const colors = {
    green: { bg: "rgba(52,211,153,0.12)", color: "var(--accent-emerald)" },
    amber: { bg: "rgba(240,169,69,0.12)", color: "var(--accent-amber)" },
    red: { bg: "rgba(244,114,182,0.12)", color: "var(--accent-rose)" },
    gray: { bg: "var(--bg-secondary)", color: "var(--text-muted)" },
  };
  const c = colors[variant];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {label}
    </span>
  );
}

export default function SegmentCard({ index, leg, support }: SegmentCardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(91,141,239,0.15)", color: "var(--accent-blue)" }}
        >
          {index + 1}
        </div>
        <div className="flex items-center gap-2">
          {getSegmentIcon(leg)}
          <span className="font-medium">{getSegmentLabel(leg)}</span>
        </div>
        <div
          className="ml-auto flex items-center gap-1 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <Clock size={14} />
          {leg.duration_min} min
        </div>
      </div>

      <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
        {leg.departure_point.name}
        {!leg.is_walking && ` → ${leg.arrival_point.name}`}
        {leg.is_walking && leg.distance_m && ` (${Math.round(leg.distance_m)} m)`}
      </p>

      {support && (
        <div className="flex flex-wrap gap-1.5">
          {support.shelter ? (
            <Badge label="Shelter available" variant="green" />
          ) : (
            <Badge label="No shelter recorded" variant="amber" />
          )}
          {support.nearby_shops_open > 0 ? (
            <Badge label={`${support.nearby_shops_open} shops open nearby`} variant="green" />
          ) : (
            <Badge label="Few open places nearby" variant="amber" />
          )}
          {support.nearby_pharmacy_open > 0 && (
            <Badge label="Pharmacy nearby" variant="green" />
          )}
          {support.nearby_aed > 0 && (
            <Badge label="AED nearby" variant="green" />
          )}
          {support.lamp_density >= 10 ? (
            <Badge label="Lighting infrastructure present" variant="green" />
          ) : support.lamp_density >= 3 ? (
            <Badge label="Sparse lighting" variant="amber" />
          ) : (
            <Badge label="Limited lighting" variant="red" />
          )}
          {support.toilet_in_station && (
            <Badge label="Toilet in station" variant="green" />
          )}
          {support.lift_disruption && (
            <Badge label="Lift disruption" variant="red" />
          )}
        </div>
      )}
    </div>
  );
}
