"use client";

import { useState, useEffect, useRef } from "react";
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
  illustrationDesc: string;
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
    illustrationDesc: "Route segments connecting stops",
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
    illustrationDesc: "Person missing a bus with no fallback",
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
    illustrationDesc: "Glowing support points near a stop",
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
    illustrationDesc: "Busy vs quiet surroundings",
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
    illustrationDesc: "Street lamps along a walking path",
  },
];

function Illustration({ module: mod, isActive }: { module: Module; isActive: boolean }) {
  const iconSize = 48;
  return (
    <div
      className="scrolly-illustration"
      style={{
        borderColor: isActive ? mod.accent : "var(--border-subtle)",
        opacity: isActive ? 1 : 0.4,
      }}
    >
      <div className="scrolly-illus-icon" style={{ color: mod.accent }}>
        {mod.id === "functional" && <Route size={iconSize} />}
        {mod.id === "waiting" && <Timer size={iconSize} />}
        {mod.id === "support" && <ShieldCheck size={iconSize} />}
        {mod.id === "activity" && <Activity size={iconSize} />}
        {mod.id === "lighting" && <Lightbulb size={iconSize} />}
      </div>
      <p className="scrolly-illus-label" style={{ color: mod.accent }}>
        {mod.title}
      </p>
      <p className="scrolly-illus-desc">{mod.illustrationDesc}</p>
      {/* Day / Night mini comparison */}
      <div className="scrolly-illus-daynight">
        <div className="scrolly-dn-mini day">
          <span className="scrolly-dn-dot" style={{ background: "var(--accent-amber)" }} />
          <span>Day</span>
        </div>
        <span className="scrolly-dn-arrow">→</span>
        <div className="scrolly-dn-mini night">
          <span className="scrolly-dn-dot" style={{ background: "var(--accent-blue)" }} />
          <span>Night</span>
        </div>
      </div>
    </div>
  );
}

export default function ModuleExplainer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.1 },
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="scrolly-container">
      {/* Left: sticky illustration panel */}
      <div className="scrolly-left">
        <div className="scrolly-sticky">
          <Illustration module={MODULES[activeIndex]} isActive={true} />
        </div>
      </div>

      {/* Right: scrolling text */}
      <div className="scrolly-right">
        {MODULES.map((mod, i) => (
          <article
            key={mod.id}
            ref={(el) => { sectionRefs.current[i] = el; }}
            className={`scrolly-text-block ${i === activeIndex ? "active" : ""}`}
          >
            <div className="module-header">
              <span className="module-icon" style={{ color: mod.accent }}>
                {mod.icon}
              </span>
              <div>
                <h3 className="module-title">{mod.title}</h3>
                <p className="module-subtitle">{mod.subtitle}</p>
              </div>
            </div>

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

            <div className="module-caution">
              <Info size={14} />
              <span>{mod.proxyNote}</span>
            </div>

            <p className="module-verdict">This is a proxy, not a verdict.</p>
          </article>
        ))}
      </div>
    </div>
  );
}
