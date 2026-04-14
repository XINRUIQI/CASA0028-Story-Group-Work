"use client";

import {
  Route,
  Timer,
  ShieldCheck,
  Activity,
  Lightbulb,
  Info,
} from "lucide-react";
import type { ReactNode } from "react";

interface Module {
  id: string;
  icon: ReactNode;
  accent: string;
  title: string;
  subtitle: string;
  shows: string;
  doesNotShow: string;
  dayLabel: string;
  nightLabel: string;
  proxyNote: string;
}

const MODULES: Module[] = [
  {
    id: "functional",
    icon: <Route size={22} />,
    accent: "var(--accent-blue)",
    title: "Functional Travel",
    subtitle: "Duration, walking, transfers, fare",
    shows:
      "How long the journey takes, how far you walk, how many times you transfer, and what it costs.",
    doesNotShow:
      "Whether the total time feels manageable — a 40-minute journey with 15 minutes of waiting feels heavier than a 40-minute journey with continuous movement.",
    dayLabel: "Frequent services, shorter walks between well-served stops.",
    nightLabel: "Longer walks to fewer stops. More transfers to stay on running lines.",
    proxyNote: "Travel time from TfL Journey Planner. Fare may vary by payment method.",
  },
  {
    id: "waiting",
    icon: <Timer size={22} />,
    accent: "var(--accent-rose)",
    title: "Waiting & Service Uncertainty",
    subtitle: "Headway, disruptions, fallback options",
    shows:
      "How long you are likely to wait, how that compares to daytime, and whether disruptions are reported.",
    doesNotShow:
      "Actual delay probability. Service uncertainty is inferred from timetable headway and status feeds, not measured delay distributions.",
    dayLabel: "Trains every 2–3 minutes. Many alternative routes if one fails.",
    nightLabel: "Headway stretches to 10–20 minutes. Fewer fallback routes. Missing one service creates a bigger penalty.",
    proxyNote: "Expected wait ≈ headway / 2 (random arrival). Not a true delay probability.",
  },
  {
    id: "support",
    icon: <ShieldCheck size={22} />,
    accent: "var(--accent-emerald)",
    title: "Support Access",
    subtitle: "Open shops, pharmacies, toilets, AEDs, shelters",
    shows:
      "How many support facilities are open near each stop — shops, pharmacies, toilets, AED points, station amenities.",
    doesNotShow:
      "Whether you will need them. Support presence is about recoverability and comfort, not about predicting emergencies.",
    dayLabel: "85% of nearby POIs open. Multiple pharmacies, convenience stores, cafés.",
    nightLabel: "Only 15% remain open after 10 pm. Many stops have zero open support within 300 m.",
    proxyNote: "Filtered by OSM opening_hours. Coverage varies; some POIs may lack opening data.",
  },
  {
    id: "activity",
    icon: <Activity size={22} />,
    accent: "var(--accent-amber)",
    title: "Activity & Exposure Proxies",
    subtitle: "Footfall, open-late POIs, night-time economy",
    shows:
      "Whether the surroundings feel active — station footfall, late-open businesses, night-time economy intensity.",
    doesNotShow:
      "Real-time pedestrian counts. This is a proxy for 'someone is around', assembled from published TfL and GLA datasets, not live surveillance.",
    dayLabel: "High footfall, busy streets, many open businesses create a sense of presence.",
    nightLabel: "Footfall drops sharply. Streets around stops become quieter, especially in outer boroughs.",
    proxyNote: "Station footfall from TfL annual data. Night-time economy from GLA MSOA-level statistics.",
  },
  {
    id: "lighting",
    icon: <Lightbulb size={22} />,
    accent: "var(--accent-blue)",
    title: "Lighting Proxy",
    subtitle: "Street lamp density, lit road share",
    shows:
      "Whether walking segments have recorded lighting infrastructure — street lamps and roads tagged as lit in OpenStreetMap.",
    doesNotShow:
      "Actual brightness. A lamp may be broken; a road tagged 'lit' may still feel dark. This is infrastructure presence, not measured illumination.",
    dayLabel: "Lighting infrastructure is the same day and night — but it only matters when it's dark.",
    nightLabel: "Walking segments in low-lit areas feel more exposed. The same 500 m walk is perceived very differently.",
    proxyNote: "OSM street_lamp nodes + lit=yes tagged roads. Not a brightness measurement.",
  },
];

export default function ModuleExplainer() {
  return (
    <div className="module-explainer">
      {MODULES.map((mod) => (
        <article key={mod.id} className="module-block reveal-section">
          {/* Left: icon + accent bar */}
          <div className="module-accent-bar" style={{ background: mod.accent }} />

          <div className="module-body">
            {/* Header */}
            <div className="module-header">
              <span className="module-icon" style={{ color: mod.accent }}>
                {mod.icon}
              </span>
              <div>
                <h3 className="module-title">{mod.title}</h3>
                <p className="module-subtitle">{mod.subtitle}</p>
              </div>
            </div>

            {/* Shows / Does not show */}
            <div className="module-grid">
              <div className="module-panel">
                <h4 className="module-panel-label shows">This shows</h4>
                <p className="module-panel-text">{mod.shows}</p>
              </div>
              <div className="module-panel">
                <h4 className="module-panel-label doesnt">This does not show</h4>
                <p className="module-panel-text">{mod.doesNotShow}</p>
              </div>
            </div>

            {/* Day vs Night comparison */}
            <div className="module-daynight">
              <div className="module-dn-cell day">
                <span className="module-dn-tag">Daytime</span>
                <p>{mod.dayLabel}</p>
              </div>
              <div className="module-dn-cell night">
                <span className="module-dn-tag">After dark</span>
                <p>{mod.nightLabel}</p>
              </div>
            </div>

            {/* Proxy caution */}
            <div className="module-caution">
              <Info size={14} />
              <span>{mod.proxyNote}</span>
            </div>

            {/* Verdict disclaimer */}
            <p className="module-verdict">This is a proxy, not a verdict.</p>
          </div>
        </article>
      ))}
    </div>
  );
}
