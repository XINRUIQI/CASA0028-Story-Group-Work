"use client";

import { Clock, ShieldCheck, Lightbulb } from "lucide-react";
import type { CardData } from "@/lib/api";

interface ComparisonCardsProps {
  /** cards keyed by time slot, each value is the 6-card dict */
  cardsByTime: Record<string, Record<string, CardData> | undefined>;
  times: string[];
}

interface CardDef {
  key: string;
  title: string;
  icon: React.ReactNode;
  accent: string;
  render: (c: CardData) => { primary: string; secondary: string };
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
      secondary: `${c.walk_min ?? 0} min walk · ${Math.round(Number(c.walk_distance_m) || 0)} m`,
    }),
    note: "Total journey time, walking, transfers, fare.",
  },
  {
    key: "support_access",
    title: "Support access",
    icon: <ShieldCheck size={18} />,
    accent: "var(--accent-emerald)",
    render: (c) => ({
      primary: `${c.total_support_open ?? "—"} open support places`,
      secondary: c.support_open_ratio != null
        ? `${Math.round(Number(c.support_open_ratio) * 100)}% of nearby POIs open`
        : "Open ratio unavailable",
    }),
    note: "Shops, pharmacies, toilets, AEDs within 300m of stops.",
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
                    <span className="comparison-time">{t}</span>
                    <span className="comparison-no-data">No data</span>
                  </div>
                );
              }
              const { primary, secondary } = def.render(card);
              return (
                <div key={t} className="comparison-cell">
                  <span className="comparison-time">{t}</span>
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
