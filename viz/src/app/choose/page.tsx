"use client";

import { useState } from "react";
import Link from "next/link";
import PersonaSwitch, {
  PERSONA_DEFS,
  type PersonaId,
} from "@/components/PersonaSwitch";
import HourlyCurves from "@/components/HourlyCurves";
import StopPointSearch from "@/components/StopPointSearch";
import { useReveal } from "@/lib/useReveal";
import type { StopPointMatch } from "@/lib/api";

const PRESET_ROUTES: Record<PersonaId, { origin: string; dest: string; oName: string; dName: string }> = {
  student:     { origin: "940GZZLUESQ", dest: "HUBSVS", oName: "Euston Square", dName: "Seven Sisters" },
  budget:      { origin: "940GZZLUSTD", dest: "940GZZLUBXN", oName: "Stratford", dName: "Brixton" },
  nightworker: { origin: "940GZZLUKSX", dest: "940GZZLUBKG", oName: "King's Cross", dName: "Barking" },
  unfamiliar:  { origin: "940GZZLUPAC", dest: "HUBGNW",  oName: "Paddington", dName: "Greenwich" },
};

export default function ChoosePage() {
  const revealRef = useReveal();
  const [persona, setPersona] = useState<PersonaId>("student");
  const [customOrigin, setCustomOrigin] = useState<StopPointMatch | null>(null);
  const [customDest, setCustomDest] = useState<StopPointMatch | null>(null);
  const [useCustom, setUseCustom] = useState(false);

  const activeDef = PERSONA_DEFS.find((p) => p.id === persona)!;
  const preset = PRESET_ROUTES[persona];
  const originId = useCustom && customOrigin ? (customOrigin.naptan_id || `${customOrigin.lat},${customOrigin.lon}`) : preset.origin;
  const destId = useCustom && customDest ? (customDest.naptan_id || `${customDest.lat},${customDest.lon}`) : preset.dest;
  const originName = useCustom && customOrigin ? customOrigin.name : preset.oName;
  const destName = useCustom && customDest ? customDest.name : preset.dName;

  const focusKeywords = activeDef.focusDimensions.map((d) =>
    d.replace(/_/g, " ").split(" ")[0],
  );

  return (
    <div ref={revealRef} className="max-w-5xl mx-auto px-6 pt-20 pb-16">
      {/* ── Header ── */}
      <section className="reveal-section text-center mb-12">
        <p className="section-label">Choose carefully</p>
        <h1 className="text-3xl font-bold mb-3">
          Same route,{" "}
          <span style={{ color: "var(--accent-amber)" }}>
            different burden profile
          </span>
        </h1>
        <p
          className="text-base max-w-2xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Not only which route — but when you leave changes what the journey asks
          of you. Different travellers weigh the same trade-offs differently.
        </p>
      </section>

      {/* ── Persona switch ── */}
      <section className="reveal-section mb-10">
        <h2 className="text-lg font-semibold mb-4">Who is travelling?</h2>
        <PersonaSwitch active={persona} onChange={setPersona} />
      </section>

      {/* ── Route context ── */}
      <section className="reveal-section card mb-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold">Route for this scenario</h2>
          <button
            className="tag"
            onClick={() => setUseCustom(!useCustom)}
          >
            {useCustom ? "Use preset route" : "Enter custom route"}
          </button>
        </div>

        {useCustom ? (
          <div className="grid md:grid-cols-2 gap-4">
            <StopPointSearch
              label="From"
              placeholder="Search origin..."
              onSelect={setCustomOrigin}
            />
            <StopPointSearch
              label="To"
              placeholder="Search destination..."
              onSelect={setCustomDest}
            />
          </div>
        ) : (
          <p className="text-lg font-medium">
            <span style={{ color: "var(--champagne-gold)" }}>{originName}</span>
            {" → "}
            <span style={{ color: "var(--champagne-gold)" }}>{destName}</span>
          </p>
        )}
      </section>

      {/* ── Hourly curves ── */}
      <section className="reveal-section mb-10">
        <h2 className="text-lg font-semibold mb-2">
          What changes most across time?
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          18:00 → 00:00 hour by hour. Dimensions highlighted for the selected
          persona.
        </p>
        <HourlyCurves
          origin={originId}
          destination={destId}
          highlightMetrics={focusKeywords}
        />
      </section>

      {/* ── Key insights per persona ── */}
      <section className="reveal-section mb-10">
        <div className="choose-insight-grid">
          <InsightCard
            accent="var(--accent-rose)"
            title="Waiting increases most after 21:00"
            body="Service frequency drops sharply. The gap between buses or Tubes stretches from 3 min to 15+ min."
          />
          <InsightCard
            accent="var(--accent-emerald)"
            title="Nearby support drops in the evening"
            body="By 22:00 most shops and pharmacies close. The walk from the stop changes character."
          />
          <InsightCard
            accent="var(--accent-amber)"
            title="Later departures are harder to recover from"
            body="Missing a 23:30 connection means a much longer penalty than missing a 18:00 one."
          />
        </div>
      </section>

      {/* ── Core statement ── */}
      <section className="reveal-section text-center mb-12">
        <blockquote className="fairness-quote">
          A faster route is not always a lighter journey.
        </blockquote>
      </section>

      {/* ── Navigation ── */}
      <section className="reveal-section text-center">
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/compare?origin=${originId}&originName=${encodeURIComponent(originName)}&destination=${destId}&destinationName=${encodeURIComponent(destName)}&times=18:00,21:00,23:30`}
            className="btn-primary px-6 py-3"
          >
            Compare this journey →
          </Link>
          <Link href="/reflection" className="btn-secondary px-6 py-3">
            Reflection & limits
          </Link>
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  accent,
  title,
  body,
}: {
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card">
      <h3
        className="text-sm font-semibold mb-2"
        style={{ color: accent }}
      >
        {title}
      </h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {body}
      </p>
    </div>
  );
}
