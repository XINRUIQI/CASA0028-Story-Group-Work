"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Moon,
  Luggage,
  MapPin,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import HeroCover from "@/components/HeroCover";
import type { ContextTag } from "@/lib/types";

/* ── Page 1: Context pills ───────────────────────────────────── */

const CONTEXT_PILLS: {
  value: ContextTag;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "travelling-alone", label: "Travelling alone", Icon: User },
  { value: "returning-late", label: "Returning late", Icon: Moon },
  { value: "carrying-bags", label: "Carrying bags", Icon: Luggage },
  { value: "unfamiliar-area", label: "Unfamiliar with the area", Icon: MapPin },
];

const CONTEXT_NEEDS: Record<ContextTag, string[]> = {
  "travelling-alone": [
    "Avoid long, quiet walking sections",
    "Keep close to open or staffed places",
    "Choose transfers that still feel active",
  ],
  "returning-late": [
    "Make sure services are still running",
    "Reduce waiting time after midnight",
    "Watch out for routes that suddenly take much longer",
  ],
  "carrying-bags": [
    "Keep walking distance manageable",
    "Avoid too many stairs or platform changes",
    "Prefer direct routes over complex transfers",
  ],
  "unfamiliar-area": [
    "Choose a route that is easy to follow",
    "Look for clear and simple interchange points",
    "Stay near places where help is available",
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

/* Moon accent in card corner (reference dusk hero) */
function TonightCardMoonDecor() {
  return (
    <div className="ctx-card-moon" aria-hidden>
      <Moon className="ctx-card-moon-lucide" size={44} strokeWidth={1.2} />
    </div>
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

  const goToCompare = () => {
    const params = new URLSearchParams();
    if (contexts.length > 0) {
      params.set("contexts", contexts.join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/compare?${qs}` : "/compare");
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
        <div className="ctx-inner">
          {/* Left: silhouette */}
          <div className="ctx-silhouette">
            <Silhouette glow={glowColor} />
          </div>

          {/* Right: cards */}
          <div className="ctx-cards">
            {/* Set up journey: kicker + title + chips + CTA */}
            <div className="ctx-card ctx-card--tonight">
              <TonightCardMoonDecor />
              <header className="ctx-tonight-header">
                <p className="ctx-tonight-kicker">Set up my journey</p>
                <h2 className="ctx-tonight-title">
                  Choose the situations that apply to your journey.
                </h2>
              </header>
              <div
                className="ctx-pill-grid ctx-pill-grid--tonight"
                role="group"
                aria-label="Situations that apply to your journey"
              >
                {CONTEXT_PILLS.map((opt) => {
                  const active = contexts.includes(opt.value);
                  const { Icon } = opt;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`ctx-pill${active ? " ctx-pill--selected" : ""}`}
                      aria-pressed={active}
                      onClick={() => toggleContext(opt.value)}
                    >
                      <span className="ctx-pill-icon" aria-hidden>
                        <Icon
                          className="ctx-pill-icon-svg"
                          strokeWidth={1.75}
                          size={17}
                        />
                      </span>
                      <span className="ctx-pill-label">{opt.label}</span>
                      <span className="ctx-pill-indicator" aria-hidden>
                        {active ? (
                          <svg
                            className="ctx-pill-check"
                            width="11"
                            height="11"
                            viewBox="0 0 11 11"
                            fill="none"
                          >
                            <path
                              d="M2.2 5.4L4.4 7.6L8.8 2.6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="ctx-journey-cta"
                onClick={goToCompare}
              >
                Choose my journey
                <ArrowRight className="ctx-journey-cta-arrow" size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {/* What may matter more */}
            <div
              className={`ctx-card ctx-needs-card ${allNeeds.length > 0 ? "has-needs" : ""}`}
            >
              <h2 className="ctx-card-title">What may matter more?</h2>
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
    </>
  );
}
