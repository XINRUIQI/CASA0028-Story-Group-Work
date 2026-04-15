"use client";

import { useState, useEffect } from "react";
import {
  Timer,
  ShieldCheck,
  Route,
  Activity,
  Lightbulb,
} from "lucide-react";
import { api, type FairnessZone } from "@/lib/api";

type LayerId =
  | "waiting_burden_increase"
  | "support_access_loss"
  | "recovery_difficulty_increase"
  | "activity_decline"
  | "low_light_walking_burden";

interface LayerDef {
  id: LayerId;
  label: string;
  icon: React.ReactNode;
  accent: string;
  unit: string;
  description: string;
}

const LAYERS: LayerDef[] = [
  {
    id: "waiting_burden_increase",
    label: "Waiting burden",
    icon: <Timer size={16} />,
    accent: "var(--accent-rose)",
    unit: "min headway",
    description: "How much longer passengers wait at night compared to daytime.",
  },
  {
    id: "support_access_loss",
    label: "Support access loss",
    icon: <ShieldCheck size={16} />,
    accent: "var(--accent-emerald)",
    unit: "open POIs",
    description: "How many support facilities close after dark in each area.",
  },
  {
    id: "recovery_difficulty_increase",
    label: "Recovery difficulty",
    icon: <Route size={16} />,
    accent: "var(--accent-blue)",
    unit: "fallback routes",
    description: "How much harder it becomes to recover from a missed connection.",
  },
  {
    id: "activity_decline",
    label: "Activity decline",
    icon: <Activity size={16} />,
    accent: "var(--accent-amber)",
    unit: "activity ratio",
    description: "How much the 'someone is around' presence fades at night.",
  },
  {
    id: "low_light_walking_burden",
    label: "Low-light walking",
    icon: <Lightbulb size={16} />,
    accent: "var(--accent-blue)",
    unit: "lit share",
    description: "Night walking burden in areas with less lighting infrastructure.",
  },
];

function dropLabel(drop: number): { text: string; color: string } {
  const abs = Math.abs(drop);
  if (abs >= 0.7) return { text: "Severe drop", color: "var(--accent-rose)" };
  if (abs >= 0.4) return { text: "Significant drop", color: "var(--accent-amber)" };
  if (abs >= 0.15) return { text: "Moderate drop", color: "var(--accent-blue)" };
  return { text: "Minimal change", color: "var(--accent-emerald)" };
}

export default function FairnessPanel() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("waiting_burden_increase");
  const [zones, setZones] = useState<Record<string, FairnessZone>>({});
  const [fetchedLayer, setFetchedLayer] = useState<string>("");
  const loading = activeLayer !== fetchedLayer;

  useEffect(() => {
    let stale = false;
    api
      .getFairnessLayer(activeLayer)
      .then((res) => { if (!stale) { setZones(res.zones || {}); setFetchedLayer(activeLayer); } })
      .catch(() => { if (!stale) { setZones({}); setFetchedLayer(activeLayer); } });
    return () => { stale = true; };
  }, [activeLayer]);

  const activeDef = LAYERS.find((l) => l.id === activeLayer)!;
  const sortedZones = Object.entries(zones).sort(
    ([, a], [, b]) => Math.abs(b.drop_ratio) - Math.abs(a.drop_ratio),
  );

  const innerZones = sortedZones.filter(
    ([code]) => !["E02000170", "E02000310", "E02000400", "E02000615"].includes(code),
  );
  const outerZones = sortedZones.filter(([code]) =>
    ["E02000170", "E02000310", "E02000400", "E02000615"].includes(code),
  );

  return (
    <div className="fairness-panel">
      {/* Layer switcher */}
      <div className="fairness-switcher">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            className={`fairness-layer-btn ${activeLayer === l.id ? "active" : ""}`}
            onClick={() => setActiveLayer(l.id)}
            style={
              activeLayer === l.id
                ? { borderColor: l.accent, color: l.accent }
                : undefined
            }
          >
            {l.icon}
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Active layer description */}
      <div className="fairness-desc">
        <span className="fairness-desc-icon" style={{ color: activeDef.accent }}>
          {activeDef.icon}
        </span>
        <p>{activeDef.description}</p>
      </div>

      {loading && (
        <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
          Loading layer data...
        </p>
      )}

      {!loading && sortedZones.length === 0 && (
        <p className="text-center py-8" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          Data not yet available for this layer.
        </p>
      )}

      {!loading && sortedZones.length > 0 && (
        <>
          {/* Inner vs Outer comparison */}
          <div className="fairness-comparison">
            <ZoneGroup
              title="Inner London"
              zones={innerZones}
            />
            <ZoneGroup
              title="Outer London"
              zones={outerZones}
            />
          </div>

          {/* All zones ranked */}
          <div className="fairness-rank">
            <h4 className="fairness-rank-title">All areas ranked by night-vs-day drop</h4>
            <div className="fairness-bars">
              {sortedZones.map(([code, zone]) => {
                const abs = Math.abs(zone.drop_ratio);
                const barWidth = Math.min(abs * 100, 100);
                const dl = dropLabel(zone.drop_ratio);
                return (
                  <div key={code} className="fairness-bar-row">
                    <span className="fairness-bar-name">{zone.name}</span>
                    <div className="fairness-bar-track">
                      <div
                        className="fairness-bar-fill"
                        style={{
                          width: `${barWidth}%`,
                          background: dl.color,
                        }}
                      />
                    </div>
                    <span className="fairness-bar-value" style={{ color: dl.color }}>
                      {(zone.drop_ratio * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ZoneGroup({
  title,
  zones,
}: {
  title: string;
  zones: [string, FairnessZone][];
}) {
  if (zones.length === 0) return null;

  const avgDay = zones.reduce((s, [, z]) => s + z.day_value, 0) / zones.length;
  const avgNight = zones.reduce((s, [, z]) => s + z.night_value, 0) / zones.length;
  const avgDrop = zones.reduce((s, [, z]) => s + z.drop_ratio, 0) / zones.length;
  const dl = dropLabel(avgDrop);

  return (
    <div className="fairness-group">
      <h4 className="fairness-group-title">{title}</h4>
      <div className="fairness-group-stats">
        <div className="fairness-group-stat">
          <span className="fairness-group-val">{avgDay.toFixed(1)}</span>
          <span className="fairness-group-lbl">Day avg</span>
        </div>
        <span className="fairness-group-arrow">→</span>
        <div className="fairness-group-stat">
          <span className="fairness-group-val">{avgNight.toFixed(1)}</span>
          <span className="fairness-group-lbl">Night avg</span>
        </div>
        <div className="fairness-group-stat">
          <span className="fairness-group-val" style={{ color: dl.color }}>
            {(avgDrop * 100).toFixed(0)}%
          </span>
          <span className="fairness-group-lbl" style={{ color: dl.color }}>
            {dl.text}
          </span>
        </div>
      </div>
      <p className="fairness-group-zones">
        {zones.map(([, z]) => z.name).join(" · ")}
      </p>
    </div>
  );
}
