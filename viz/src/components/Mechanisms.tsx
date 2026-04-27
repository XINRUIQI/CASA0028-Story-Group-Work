"use client";

import {
  Timer,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  LifeBuoy,
  AlertTriangle,
  X,
} from "lucide-react";

interface MechanismsProps {
  onClose?: () => void;
}

interface MechanismEntry {
  key: string;
  icon: React.ReactNode;
  label: string;
  source: string;
  description: string;
  formula?: string;
}

const ENTRIES: MechanismEntry[] = [
  {
    key: "waiting",
    icon: <Timer size={16} />,
    label: "Waiting Time at stations",
    source: "waiting_burden",
    description:
      "Expected wait time accumulated across all transfer points, weighted by line-specific headway at the departure hour.",
    formula: "E[W] = Σ (headway_i × penalty_i) for each transfer i",
  },
  {
    key: "support",
    icon: <ShieldCheck size={16} />,
    label: "Support nearby",
    source: "support_access",
    description:
      "Number of support points (shops, pharmacies, healthcare, toilets, AEDs) currently open within 300 m of every station visited on the route.",
    formula: "support_open = Σ POIs_within_300m(open_at_t) along route",
  },
  {
    key: "service",
    icon: <HelpCircle size={16} />,
    label: "Service uncertainty",
    source: "service_uncertainty",
    description:
      "Composite score from live-vs-scheduled headway gap, disruption status, and residual-time variance. Higher = less predictable.",
    formula: "U = w1·gap_ratio + w2·disruption_flag + w3·variance",
  },
  {
    key: "lighting",
    icon: <Lightbulb size={16} />,
    label: "Lighting proxy",
    source: "lighting_proxy",
    description:
      "Mean count of street lamps per 100 m of the walking segments of the journey, classified into well / moderate / sparse.",
    formula: "lamps_per_walk = total_lamps / (walk_distance_m / 100)",
  },
  {
    key: "recovery",
    icon: <LifeBuoy size={16} />,
    label: "Recovery time",
    source: "journey_recovery",
    description:
      "If the worst interchange is missed, expected additional wait until the next viable service, averaged across all transfer points.",
    formula: "E[penalty] = mean(extra_wait_min across transfers)",
  },
  {
    key: "safety",
    icon: <AlertTriangle size={16} />,
    label: "Safety Exposure Level",
    source: "safety_exposure",
    description:
      "Corridor-level percentile of late-night incident density intersected with the route polyline, expressed as 0–100.",
    formula: "exposure = percentile(crime_density ∩ route_buffer_50m)",
  },
];

export default function Mechanisms({ onClose }: MechanismsProps) {
  return (
    <div className="mechanisms-panel">
      <div className="mechanisms-header">
        <div>
          <p className="section-label">Behind the numbers</p>
          <h2 className="mechanisms-title">Mechanisms</h2>
          <p className="mechanisms-sub">
            How each of the six dimensions is computed. These are placeholders —
            exact formulas will land here.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="mechanisms-close"
            onClick={onClose}
            aria-label="Close mechanisms"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mechanisms-grid">
        {ENTRIES.map((e) => (
          <div key={e.key} className="mechanisms-card">
            <div className="mechanisms-card-head">
              <span className="mechanisms-icon">{e.icon}</span>
              <span className="mechanisms-card-label">{e.label}</span>
            </div>
            <p className="mechanisms-desc">{e.description}</p>
            {e.formula && (
              <code className="mechanisms-formula">{e.formula}</code>
            )}
            <div className="mechanisms-source">source: {e.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
