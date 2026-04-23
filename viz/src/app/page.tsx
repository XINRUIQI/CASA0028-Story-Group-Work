"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, Activity, HelpCircle } from "lucide-react";
import HeroCover from "@/components/HeroCover";
import PresetJourneys from "@/components/PresetJourneys";
import TimeSelector from "@/components/TimeSelector";
import DimensionCard from "@/components/DimensionCard";
import {
  COMPARE_TIMES,
  FIXED_ROUTE_PRESETS,
} from "@/lib/journeyPresets";
import { useReveal } from "@/lib/useReveal";
import type { ContextTag } from "@/lib/types";

/* ── Page 1: Context checkboxes ──────────────────────────────── */

const CONTEXT_CHECKS: { value: ContextTag; label: string }[] = [
  { value: "travelling-alone", label: "Travelling alone" },
  { value: "returning-late", label: "Returning late" },
  { value: "carrying-bags", label: "Carrying bags" },
  { value: "unfamiliar-area", label: "Unfamiliar with the area" },
];

const CONTEXT_NEEDS: Record<ContextTag, string[]> = {
  "travelling-alone": [
    "Open shops or staffed places along walking routes (support nearby)",
    "Routes where other people are likely to be around",
    "Well-lit paths between stops",
  ],
  "returning-late": [
    "Less time waiting at stops (sensitivity to uncertainty)",
    "High fault tolerance — backup options if a bus is missed",
    "Reliable late-night service with shorter gaps",
  ],
  "carrying-bags": [
    "Shorter walking segments between stops",
    "Fewer interchanges and level changes",
    "Shelter and seating at waiting points",
  ],
  "unfamiliar-area": [
    "Simple, easy-to-follow routes with fewer transfers",
    "Well-signed interchanges and clear wayfinding",
    "Lower cost of mistakes — easier to recover from a wrong stop",
  ],
  commuting: [
    "Predictable journey time with consistent service",
    "Good recovery options if service is disrupted",
  ],
  "student-budget": [
    "Avoid costly missed connections",
    "Access to support facilities along the route",
  ],
};

/* ── Dimension cards data ────────────────────────────────────── */

const DIMENSIONS = [
  {
    icon: <Clock size={20} style={{ color: "var(--champagne-gold)" }} />,
    title: "Waiting",
    description:
      "How long you may wait, and what happens if you miss a connection.",
  },
  {
    icon: <ShieldCheck size={20} style={{ color: "var(--champagne-gold)" }} />,
    title: "Support nearby",
    description:
      "Shelters, open shops, pharmacies, and other facilities along the route.",
  },
  {
    icon: <Activity size={20} style={{ color: "var(--champagne-gold)" }} />,
    title: "Activity around stops",
    description:
      "Whether the surroundings are busy or quiet at different times.",
  },
  {
    icon: <HelpCircle size={20} style={{ color: "var(--champagne-gold)" }} />,
    title: "Service uncertainty index",
    description:
      "A percentage index that rises when alternatives thin out, headways get sparser, transfers increase, or live service status turns abnormal.",
  },
];

const FIXED_ROUTE_OPTIONS = [
  {
    key: "student",
    label: "Euston Square → Seven Sisters",
    description: "Travelling alone",
  },
  {
    key: "budget",
    label: "Stratford → Brixton",
    description: "Carrying bags",
  },
  {
    key: "nightworker",
    label: "King's Cross St Pancras → Barking",
    description: "Returning late",
  },
  {
    key: "unfamiliar",
    label: "Paddington → Greenwich",
    description: "Unfamiliar area",
  },
] as const;

type FixedRouteOptionKey = (typeof FIXED_ROUTE_OPTIONS)[number]["key"];

/* ── Silhouette SVG ──────────────────────────────────────────── */

function Silhouette({ glow }: { glow: string }) {
  return (
    <svg
      viewBox="0 0 200 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ctx-silhouette-svg"
    >
      <defs>
        <radialGradient id="silGlow" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="70%" stopColor={glow} stopOpacity="0.04" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="silBody" x1="100" y1="20" x2="100" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
          <stop offset="40%" stopColor={glow} stopOpacity="0.25" />
          <stop offset="100%" stopColor={glow} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="200" rx="95" ry="170" fill="url(#silGlow)" />
      {/* Head */}
      <ellipse cx="100" cy="52" rx="22" ry="26" fill="url(#silBody)" />
      {/* Neck */}
      <rect x="93" y="78" width="14" height="14" rx="3" fill="url(#silBody)" />
      {/* Torso */}
      <path
        d="M68 92 C68 88 78 85 100 85 C122 85 132 88 132 92 L136 200 C136 206 132 210 126 210 L74 210 C68 210 64 206 64 200 Z"
        fill="url(#silBody)"
      />
      {/* Left arm */}
      <path
        d="M68 96 L48 150 L44 190 C43 196 46 198 50 196 L56 180 L62 150 L68 120"
        stroke="url(#silBody)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right arm */}
      <path
        d="M132 96 L152 150 L156 190 C157 196 154 198 150 196 L144 180 L138 150 L132 120"
        stroke="url(#silBody)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Left leg */}
      <path
        d="M82 208 L76 320 L72 400 C71 412 74 420 80 420 L90 420 C94 420 96 416 95 410 L92 320 L90 240"
        fill="url(#silBody)"
      />
      {/* Right leg */}
      <path
        d="M118 208 L124 320 L128 400 C129 412 126 420 120 420 L110 420 C106 420 104 416 105 410 L108 320 L110 240"
        fill="url(#silBody)"
      />
      {/* Ground shadow */}
      <ellipse cx="100" cy="430" rx="60" ry="8" fill={glow} opacity="0.08" />
    </svg>
  );
}

/* ── Page component ──────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();
  const revealRef = useReveal();

  const [selectedRoute, setSelectedRoute] = useState<FixedRouteOptionKey>("student");
  const [times, setTimes] = useState<string[]>([...COMPARE_TIMES]);
  const [contexts, setContexts] = useState<ContextTag[]>([]);

  const selectedJourney = FIXED_ROUTE_PRESETS[selectedRoute];
  const canCompare = times.length >= 2;

  const toggleContext = (ctx: ContextTag) => {
    setContexts((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx],
    );
  };

  const allNeeds: string[] = [];
  const seen = new Set<string>();
  for (const ctx of contexts) {
    for (const need of CONTEXT_NEEDS[ctx] ?? []) {
      if (!seen.has(need)) {
        seen.add(need);
        allNeeds.push(need);
      }
    }
  }

  const CONTEXT_COLORS: Record<ContextTag, string> = {
    "travelling-alone": "#c9a96e",
    "returning-late": "#d4b77d",
    "carrying-bags": "#b8a472",
    "unfamiliar-area": "#d4946a",
    commuting: "#a8894f",
    "student-budget": "#b8a472",
  };

  const glowColor =
    contexts.length === 0
      ? "#c9a96e"
      : CONTEXT_COLORS[contexts[contexts.length - 1]] ?? "#c9a96e";

  const handleCompare = () => {
    if (!canCompare) return;
    const params = new URLSearchParams({
      origin: selectedJourney.origin,
      originName: selectedJourney.originName,
      destination: selectedJourney.destination,
      destinationName: selectedJourney.destinationName,
      times: times.join(","),
      contexts: contexts.join(","),
    });
    router.push(`/compare?${params.toString()}`);
  };

  return (
    <>
      {/* ═══════════════ Page 0: Cinematic cover ═══════════════ */}
      <HeroCover />

      {/* ═══════════════ Page 1: Context selection ═══════════════ */}
      <section className="ctx-page">
        {/* Map-like background lines */}
        <div className="ctx-map-bg" />

        <div className="ctx-inner">
          {/* Left: silhouette */}
          <div className="ctx-silhouette">
            <Silhouette glow={glowColor} />
          </div>

          {/* Right: cards */}
          <div className="ctx-cards">
            {/* Tonight I am... */}
            <div className="ctx-card">
              <h2 className="ctx-card-title">
                Tonight I am...{" "}
                <span className="ctx-card-hint">
                  (Please select your context)
                </span>
              </h2>
              <div className="ctx-checks">
                {CONTEXT_CHECKS.map((opt) => {
                  const active = contexts.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className="ctx-check-row"
                      onClick={() => toggleContext(opt.value)}
                    >
                      <span
                        className={`ctx-checkbox ${active ? "checked" : ""}`}
                      >
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 12 12">
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="ctx-check-label">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* So, I need... */}
            <div
              className={`ctx-card ctx-needs-card ${allNeeds.length > 0 ? "has-needs" : ""}`}
            >
              <h2 className="ctx-card-title">
                So, I need...{" "}
                <span className="ctx-card-hint">
                  (System dynamically populates based on selection)
                </span>
              </h2>
              {allNeeds.length === 0 ? (
                <p className="ctx-needs-empty">
                  Select one or more situations above to see what matters most.
                </p>
              ) : (
                <ul className="ctx-needs-list">
                  {allNeeds.map((need) => (
                    <li key={need}>{need}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Below: Journey selection ═══════════════ */}
      <div ref={revealRef} className="max-w-5xl mx-auto px-6 py-20">
        {/* ── Preset journeys ── */}
        <section className="reveal-section mb-6">
          <p className="section-label">Try a preset journey</p>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Each route represents a typical late-night scenario. Click to see how
            it changes across departure times.
          </p>
          <PresetJourneys />
        </section>

        {/* ── OR divider ── */}
        <div className="section-or reveal-section">or choose route and times</div>

        {/* ── Fixed journey chooser ── */}
        <section className="reveal-section card mb-8">
          <h2 className="text-lg font-semibold mb-4">Plan your own journey</h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            To keep comparisons consistent, this prototype now limits planning to the same four study routes used above.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {FIXED_ROUTE_OPTIONS.map((route) => {
              const preset = FIXED_ROUTE_PRESETS[route.key];
              const active = route.key === selectedRoute;
              return (
                <button
                  key={route.key}
                  type="button"
                  className="text-left rounded-2xl px-4 py-4 transition"
                  onClick={() => setSelectedRoute(route.key)}
                  style={{
                    background: active ? "rgba(201,169,110,0.14)" : "var(--bg-secondary)",
                    border: active
                      ? "1px solid var(--champagne-gold)"
                      : "1px solid rgba(201,169,110,0.12)",
                  }}
                >
                  <div className="text-sm font-semibold mb-1">{preset.originName} → {preset.destinationName}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {route.description}
                  </div>
                </button>
              );
            })}
          </div>
          <TimeSelector selected={times} onChange={setTimes} />
        </section>

        {/* ── Compare button ── */}
        <div className="reveal-section text-center mb-20">
          <button
            className="btn-primary text-lg px-8 py-3"
            disabled={!canCompare}
            onClick={handleCompare}
          >
            Compare this journey
          </button>
          {!canCompare && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Choose one of the four routes and at least two departure times.
            </p>
          )}
        </div>

        {/* ── What changes after dark ── */}
        <section className="reveal-section mb-12">
          <h2 className="text-xl font-semibold text-center mb-6">
            What changes after dark?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIMENSIONS.map((d) => (
              <DimensionCard key={d.title} {...d} />
            ))}
          </div>
          <p
            className="text-sm text-center mt-4"
            style={{ color: "var(--text-muted)" }}
          >
            Not all journey costs appear in total travel time.
          </p>
        </section>

        <p
          className="reveal-section text-center text-sm max-w-lg mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          The same route can feel more fragmented, less supported, and harder to
          recover from after dark.
        </p>
      </div>
    </>
  );
}
