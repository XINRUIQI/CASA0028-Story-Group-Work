"use client";

import {
  Clock,
  Timer,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Lightbulb,
} from "lucide-react";
import type { CardData } from "@/lib/api";
import { formatDisplayTime } from "@/lib/journeyPresets";
import { normalizeServiceUncertainty } from "@/lib/serviceUncertainty";

interface ComparisonCardsProps {
  /** cards keyed by time slot, each value is the comparison card dict */
  cardsByTime: Record<string, Record<string, CardData> | undefined>;
  times: string[];
}

interface CardDef {
  key: string;
  title: string;
  icon: React.ReactNode;
  accent: string;
  render: (c: CardData, cards?: Record<string, CardData>) => { primary: string; secondary: string };
  note: string;
}

const CARD_DEFS: CardDef[] = [
  {
    key: "functional_cost",
    title: "Functional cost",
    icon: <Clock size={18} />,
    accent: "var(--champagne-gold)",
    render: (c) => ({
      primary: `${c.total_duration_min ?? "—"} min · ${c.transfers ?? 0} transfers`,
      secondary: `~${c.walk_min ?? 0} min interchange walk · ~${Math.round(Number(c.walk_distance_m) || 0)} m`,
    }),
    note: "Total journey time, estimated interchange walking, transfers, fare.",
  },
  {
    key: "waiting_burden",
    title: "Waiting burden",
    icon: <Timer size={18} />,
    accent: "var(--accent-rose)",
    render: (c) => ({
      primary: `~${c.total_expected_wait_min ?? "—"} min expected wait`,
      secondary: `Max single wait: ${c.max_single_wait_min ?? "—"} min · ${Math.round(Number(c.wait_share_of_journey ?? 0) * 100)}% of journey`,
    }),
    note: "Estimated from headway. Random-arrival assumption.",
  },
  {
    key: "service_uncertainty",
    title: "Service uncertainty index",
    icon: <ShieldAlert size={18} />,
    accent: "var(--accent-amber)",
    render: (c, cards) => {
      const uncertainty = normalizeServiceUncertainty(
        c,
        Number(cards?.functional_cost?.transfers ?? 0),
      );
      return {
        primary: uncertainty.scorePct != null
          ? `${Math.round(uncertainty.scorePct)}% index${uncertainty.label ? ` · ${uncertainty.label}` : ""}`
          : "Index unavailable",
        secondary:
          uncertainty.scorePct != null
            ? `Alt +${uncertainty.alternativesComponent} · Headway +${uncertainty.headwayComponent} · Transfers +${uncertainty.transferComponent} · Status +${uncertainty.statusComponent}`
            : uncertainty.meanAlternativeRoutes != null || uncertainty.meanHeadwayGapRatio != null
              ? `Alt routes: ${uncertainty.meanAlternativeRoutes != null ? uncertainty.meanAlternativeRoutes.toFixed(1) : "—"} · Headway ${uncertainty.meanHeadwayGapRatio != null ? `${uncertainty.meanHeadwayGapRatio}×` : "—"}`
              : Number(c.disruption_count ?? 0) > 0
                ? `${Number(c.disruption_count)} abnormal status signal(s)`
                : "Live status and timetable signals unavailable",
      };
    },
    note: "Index rises when alternatives thin out, headways get sparser, transfers increase, or live status turns abnormal.",
  },
  {
    key: "support_access",
    title: "Support access",
    icon: <ShieldCheck size={18} />,
    accent: "var(--accent-emerald)",
    render: (c) => ({
      primary: `${c.total_support_open ?? "—"} open support places`,
      secondary: c.route_support_index != null
        ? `Route support index ${Number(c.route_support_index).toFixed(2)} · ${c.overlapping_msoa_count ?? c.msoa_match_count ?? 0} MSOAs touched`
        : c.support_open_ratio != null
          ? `${Math.round(Number(c.support_open_ratio) * 100)}% of nearby POIs open`
          : "Open ratio unavailable",
    }),
    note: "Stop POIs plus corridor-weighted MSOA support context.",
  },
  {
    key: "activity_context",
    title: "Activity context",
    icon: <Activity size={18} />,
    accent: "var(--accent-amber)",
    render: (c) => ({
      primary: c.route_activity_index != null
        ? `Activity index ${Number(c.route_activity_index).toFixed(2)}`
        : `${c.open_support_density ?? "—"} mean open POIs per stop`,
      secondary: c.route_venue_density != null
        ? `${Number(c.route_venue_density).toFixed(1)} venue intensity along route`
        : c.nte_data_available ? "Night-time economy data available" : "Limited activity data",
    }),
    note: "Corridor-weighted MSOA activity context, not real-time crowd count.",
  },
  {
    key: "safety_exposure",
    title: "Safety exposure",
    icon: <Shield size={18} />,
    accent: "var(--accent-rose)",
    render: (c) => {
      const safetyLabel = typeof c.exposure_label === "string"
        ? c.exposure_label
        : typeof c.safety_exposure_label === "string"
          ? c.safety_exposure_label
          : null;
      return {
        primary: c.safety_exposure_pct != null
        ? `${Math.round(Number(c.safety_exposure_pct))}% exposure${safetyLabel ? ` · ${String(safetyLabel)}` : ""}`
        : c.route_safety_index != null
          ? `Safety index ${Number(c.route_safety_index).toFixed(2)}`
          : "Safety context unavailable",
        secondary: c.route_crime_percentile != null || c.route_visibility_index != null
        ? `Crime severity ${c.route_crime_percentile != null ? `${Math.round(Number(c.route_crime_percentile) * 100)}th pct` : "—"} · Visibility ${c.route_visibility_index != null ? Number(c.route_visibility_index).toFixed(2) : "—"}`
        : `${c.lsoa_match_count ?? 0} LSOAs touched`,
      };
    },
    note: "Corridor-weighted LSOA night safety proxy from crime severity and visibility context, not a personal danger prediction.",
  },
  {
    key: "lighting_proxy",
    title: "Lighting proxy",
    icon: <Lightbulb size={18} />,
    accent: "var(--champagne-gold)",
    render: (c) => ({
      primary: `${c.mean_lamps_per_walk ?? "—"} lamps per walk segment`,
      secondary: String(c.label ?? ""),
    }),
    note: "Infrastructure presence from OSM, not measured brightness.",
  },
];

export default function ComparisonCards({ cardsByTime, times }: ComparisonCardsProps) {
  return (
    <div className="comparison-grid">
      {CARD_DEFS.map((def) => (
        <div key={def.key} className="comparison-row">
          {/* Row header */}
          <div className="comparison-header">
            <span className="comparison-icon" style={{ color: def.accent }}>
              {def.icon}
            </span>
            <div>
              <h4 className="comparison-title">{def.title}</h4>
              <p className="comparison-note">{def.note}</p>
            </div>
          </div>

          {/* Per-time cells */}
          <div className="comparison-cells">
            {times.map((t) => {
              const cards = cardsByTime[t];
              const card = cards?.[def.key];
              if (!card) {
                return (
                  <div key={t} className="comparison-cell empty">
                    <span className="comparison-time">{formatDisplayTime(t)}</span>
                    <span className="comparison-no-data">No data</span>
                  </div>
                );
              }
              const { primary, secondary } = def.render(card, cards);
              return (
                <div key={t} className="comparison-cell">
                  <span className="comparison-time">{formatDisplayTime(t)}</span>
                  <span className="comparison-primary">{primary}</span>
                  <span className="comparison-secondary">{secondary}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
