"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, Activity, HelpCircle } from "lucide-react";
import HeroCover from "@/components/HeroCover";
import StopPointSearch from "@/components/StopPointSearch";
import TimeSelector from "@/components/TimeSelector";
import TagSelector from "@/components/TagSelector";
import DimensionCard from "@/components/DimensionCard";
import { CONTEXT_LABELS, type ContextTag } from "@/lib/types";
import type { StopPointMatch } from "@/lib/api";

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

export default function LandingPage() {
  const router = useRouter();
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
      {/* ── Page 0: Cinematic cover ──────────────────────────── */}
      <HeroCover />

      {/* ── Page 1: Problem & needs ──────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Section intro */}
        <section className="text-center mb-16">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "var(--accent-amber)" }}
          >
            Same path, different demands
          </p>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Plan one journey, compare across time
          </h2>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Enter a route below. The system will show how the same origin and
            destination change in waiting, support, activity and uncertainty at
            different departure times.
          </p>
        </section>

        {/* Journey input */}
        <section className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Choose your journey
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

        {/* Tonight I am... */}
        <section className="card mb-8">
          <h2 className="text-lg font-semibold mb-2">Tonight I am...</h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            This does not change the city. It changes the lens through which you
            compare it.
          </p>
          <TagSelector
            options={CONTEXT_OPTIONS}
            selected={contexts}
            onChange={setContexts}
          />
        </section>

        {/* Compare button */}
        <div className="text-center mb-16">
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

        {/* What changes after dark */}
        <section className="mb-12">
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

        {/* Transition footer */}
        <p
          className="text-center text-sm max-w-lg mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          The same route can feel more fragmented, less supported, and harder to
          recover from after dark.
        </p>
      </div>
    </>
  );
}
