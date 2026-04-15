"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ShieldCheck,
  Activity,
  HelpCircle,
  GraduationCap,
  Coins,
  Briefcase,
  MapPinOff,
} from "lucide-react";
import HeroCover from "@/components/HeroCover";
import PersonaCard from "@/components/PersonaCard";
import type { Persona } from "@/components/PersonaCard";
import NeedsList from "@/components/NeedsList";
import PresetJourneys from "@/components/PresetJourneys";
import StopPointSearch from "@/components/StopPointSearch";
import TimeSelector from "@/components/TimeSelector";
import TagSelector from "@/components/TagSelector";
import DimensionCard from "@/components/DimensionCard";
import { useReveal } from "@/lib/useReveal";
import { CONTEXT_LABELS, type ContextTag } from "@/lib/types";
import type { StopPointMatch } from "@/lib/api";

/* ── Persona data ────────────────────────────────────────────── */

const PERSONAS: Persona[] = [
  {
    id: "student",
    icon: <GraduationCap size={18} style={{ color: "var(--accent-blue)" }} />,
    title: "Late-night student",
    who: "Returning from the library after 10 pm",
    situation:
      "The Tube might still run, but the walk home from the station is long and quiet.",
    concerns: [
      "Waiting alone at empty platforms",
      "Few people around during the walk",
    ],
    accentColor: "#5b8def",
  },
  {
    id: "budget",
    icon: <Coins size={18} style={{ color: "var(--accent-amber)" }} />,
    title: "Budget traveller",
    who: "Relying on public transport to save money",
    situation:
      "A missed bus may mean an expensive taxi. Fare penalties grow after dark.",
    concerns: [
      "Missed-connection cost is high",
      "Fewer fallback options late at night",
    ],
    accentColor: "#f0a945",
  },
  {
    id: "nightworker",
    icon: <Briefcase size={18} style={{ color: "var(--accent-emerald)" }} />,
    title: "Night-shift worker",
    who: "Finishing work after midnight",
    situation:
      "Regular routes shut down. Night buses run, but infrequently and with longer walks.",
    concerns: [
      "Service reliability after last Tube",
      "Long gaps between night buses",
    ],
    accentColor: "#34d399",
  },
  {
    id: "unfamiliar",
    icon: <MapPinOff size={18} style={{ color: "var(--accent-rose)" }} />,
    title: "Unfamiliar traveller",
    who: "First time using this route at night",
    situation:
      "Transfers are confusing in the dark. A wrong stop could mean a very different journey.",
    concerns: [
      "Complex interchanges after dark",
      "Hard to recover from mistakes",
    ],
    accentColor: "#f472b6",
  },
];

/* ── Context & dimension data ────────────────────────────────── */

const CONTEXT_OPTIONS = Object.entries(CONTEXT_LABELS).map(([value, label]) => ({
  value: value as ContextTag,
  label,
}));

const DIMENSIONS = [
  {
    icon: <Clock size={20} style={{ color: "var(--accent-blue)" }} />,
    title: "Waiting",
    description: "How long you may wait, and what happens if you miss a connection.",
  },
  {
    icon: <ShieldCheck size={20} style={{ color: "var(--accent-emerald)" }} />,
    title: "Support nearby",
    description: "Shelters, open shops, pharmacies, and other facilities along the route.",
  },
  {
    icon: <Activity size={20} style={{ color: "var(--accent-amber)" }} />,
    title: "Activity around stops",
    description: "Whether the surroundings are busy or quiet at different times.",
  },
  {
    icon: <HelpCircle size={20} style={{ color: "var(--accent-rose)" }} />,
    title: "Service uncertainty",
    description: "How predictable the service is, and whether disruptions are reported.",
  },
];

/* ── Page component ──────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();
  const revealRef = useReveal();

  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [origin, setOrigin] = useState<StopPointMatch | null>(null);
  const [destination, setDestination] = useState<StopPointMatch | null>(null);
  const [times, setTimes] = useState<string[]>(["18:00", "21:00", "22:30"]);
  const [contexts, setContexts] = useState<ContextTag[]>([]);

  const canCompare = origin && destination && times.length >= 2;

  const handleCompare = () => {
    if (!canCompare) return;
    const originId =
      origin.lat && origin.lon
        ? `${origin.lat},${origin.lon}`
        : origin.naptan_id;
    const destId =
      destination.lat && destination.lon
        ? `${destination.lat},${destination.lon}`
        : destination.naptan_id;
    const params = new URLSearchParams({
      origin: originId,
      originName: origin.name,
      destination: destId,
      destinationName: destination.name,
      times: times.join(","),
      contexts: contexts.join(","),
    });
    router.push(`/compare?${params.toString()}`);
  };

  return (
    <>
      {/* ═══════════════ Page 0: Cinematic cover ═══════════════ */}
      <HeroCover />

      {/* ═══════════════ Page 1: Problem & needs ═══════════════ */}
      <div ref={revealRef} className="max-w-5xl mx-auto px-6 py-20">
        {/* ── 1A: Who travels after dark ── */}
        <section className="reveal-section text-center mb-16">
          <p className="section-label">Who travels after dark?</p>
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            The same journey asks different things of different people
          </h2>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            A late-night student worries about waiting alone. A budget traveller
            worries about missing the last bus. Their routes may overlap — but
            their burdens do not.
          </p>
        </section>

        {/* ── 1B: Persona cards ── */}
        <section className="reveal-section mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PERSONAS.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                selected={selectedPersona === p.id}
                onSelect={setSelectedPersona}
              />
            ))}
          </div>
        </section>

        {/* ── 1C: Tonight I am... + I need... ── */}
        <section className="reveal-section mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Tonight I am... */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Tonight I am...</h2>
              <p
                className="text-xs mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                This does not change the data. It changes the lens through which
                you read it.
              </p>
              <TagSelector
                options={CONTEXT_OPTIONS}
                selected={contexts}
                onChange={setContexts}
              />
            </div>

            {/* Right: I need... */}
            <div className="card">
              <NeedsList selectedContexts={contexts} />
            </div>
          </div>
        </section>

        {/* ── 1D: Try a preset journey ── */}
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
        <div className="section-or reveal-section">or enter your own</div>

        {/* ── 1E: Custom journey input ── */}
        <section className="reveal-section card mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Plan your own journey
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <StopPointSearch
              label="From"
              placeholder="Search origin stop or station..."
              onSelect={setOrigin}
            />
            <StopPointSearch
              label="To"
              placeholder="Search destination stop or station..."
              onSelect={setDestination}
            />
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
              Select origin, destination, and at least two departure times.
            </p>
          )}
        </div>

        {/* ── 1F: What changes after dark (transition to Page 2) ── */}
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

        {/* ── Page transition ── */}
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
