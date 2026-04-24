"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HeroCover from "@/components/HeroCover";
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

  const [contexts, setContexts] = useState<ContextTag[]>([]);

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
    "travelling-alone": "#8b7bd8",
    "returning-late": "#d65a7e",
    "carrying-bags": "#6abfa8",
    "unfamiliar-area": "#e07a5f",
    commuting: "#a8894f",
    "student-budget": "#b8a472",
  };

  const glowColor =
    contexts.length === 0
      ? "#c9a96e"
      : CONTEXT_COLORS[contexts[contexts.length - 1]] ?? "#c9a96e";

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

            {/* Jump to compare page */}
            <div className="ctx-cta-wrap">
              <button
                type="button"
                className="hero-cta"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (contexts.length > 0) {
                    params.set("contexts", contexts.join(","));
                  }
                  const qs = params.toString();
                  router.push(qs ? `/compare?${qs}` : "/compare");
                }}
              >
                Choose my journey
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
