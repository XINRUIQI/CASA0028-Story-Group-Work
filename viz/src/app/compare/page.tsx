"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import JourneyTimelineCompare from "@/components/JourneyTimelineCompare";
import OptionCard from "@/components/OptionCard";
import RouteMap from "@/components/RouteMap";
import Mechanisms from "@/components/Mechanisms";
import {
  PERSONA_DEFS,
  PERSONA_ROUTES,
  type PersonaId,
} from "@/components/PersonaSwitch";
import PersonaInsightsPanel from "@/components/PersonaInsightsPanel";
import { useReveal } from "@/lib/useReveal";
import { type ContextTag, CONTEXT_LABELS } from "@/lib/types";
import {
  api,
  type CompareResult,
  type CompareCardsResult,
  type CardData,
  type JourneyRecoveryResult,
} from "@/lib/api";

const TIME_LABELS: Record<string, string> = {
  "18:00": "☀️ Daytime",
  "21:00": "🌆 Evening",
  "22:30": "🌙 Late Night",
  "23:00": "🌙 Late Night",
  "23:30": "🌙 Late Night",
};

const TIME_COLORS = [
  "var(--champagne-gold)",
  "var(--accent-amber)",
  "var(--accent-rose)",
  "var(--accent-emerald)",
];

const DEFAULT_ORIGIN = "940GZZLUESQ";
const DEFAULT_ORIGIN_NAME = "Euston Square";
const DEFAULT_DEST = "HUBSVS";
const DEFAULT_DEST_NAME = "Seven Sisters";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const timesParam = searchParams.get("times") || "18:00,21:00,23:30";
  const contextsParam = searchParams.get("contexts") || "";

  const times = timesParam.split(",").filter(Boolean);
  const contexts = contextsParam.split(",").filter(Boolean) as ContextTag[];
  const [persona, setPersona] = useState<PersonaId | null>(null);

  const urlOrigin = searchParams.get("origin");
  const urlOriginName = searchParams.get("originName");
  const urlDest = searchParams.get("destination");
  const urlDestName = searchParams.get("destinationName");

  const activeRoute = persona ? PERSONA_ROUTES[persona] : null;
  const origin = activeRoute?.origin ?? urlOrigin ?? DEFAULT_ORIGIN;
  const originName =
    activeRoute?.oName ?? urlOriginName ?? urlOrigin ?? DEFAULT_ORIGIN_NAME;
  const destination = activeRoute?.dest ?? urlDest ?? DEFAULT_DEST;
  const destinationName =
    activeRoute?.dName ?? urlDestName ?? urlDest ?? DEFAULT_DEST_NAME;

  const [data, setData] = useState<CompareResult | null>(null);
  const [cardsData, setCardsData] = useState<CompareCardsResult | null>(null);
  const [recoveryByTime, setRecoveryByTime] = useState<
    Record<string, JourneyRecoveryResult | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mechanismsOpen, setMechanismsOpen] = useState(false);

  const revealRef = useReveal();
  const mechanismsRef = useRef<HTMLDivElement | null>(null);

  const handleToggleMechanisms = () => {
    setMechanismsOpen((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(() => {
          mechanismsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
      return next;
    });
  };

  useEffect(() => {
    if (!origin || !destination) return;
    setLoading(true);
    setError("");

    Promise.all([
      api.compareJourney(origin, destination, times),
      api.compareCards(origin, destination, times).catch(() => null),
    ])
      .then(([compare, cards]) => {
        setData(compare);
        setCardsData(cards);
        // Fetch recovery profiles in parallel (one per departure time) so
        // OptionCard can show the real "Recovery time" metric. This is
        // best‑effort — if any call fails we simply leave that slot null.
        const entries = Object.entries(compare.options);
        return Promise.all(
          entries.map(async ([t, j]) => {
            if (!j || !j.legs?.length) return [t, null] as const;
            try {
              const r = await api.getJourneyRecovery(j.legs, t);
              return [t, r] as const;
            } catch {
              return [t, null] as const;
            }
          }),
        );
      })
      .then((pairs) => {
        if (!pairs) return;
        const map: Record<string, JourneyRecoveryResult | null> = {};
        for (const [t, r] of pairs) map[t] = r;
        setRecoveryByTime(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, timesParam]);

  const activeDef = persona
    ? PERSONA_DEFS.find((p) => p.id === persona) ?? null
    : null;
  const highlightedMetrics = activeDef
    ? activeDef.focusDimensions.map((d) => d.replace(/_/g, " ").split(" ")[0])
    : [];

  const cardsByTime: Record<string, Record<string, CardData> | undefined> = {};
  if (cardsData) {
    for (const t of times) {
      const opt = cardsData.options[t];
      if (opt) cardsByTime[t] = opt.cards;
    }
  }

  return (
    <div ref={revealRef} className="max-w-6xl mx-auto px-6 pt-20 pb-16">
      {/* ── Header ── */}
      <section className="reveal-section mb-8">
        <p className="section-label">The Core Prototype</p>
        <h1 className="text-3xl font-bold mb-2">
          Compare Options, Not Just Routes
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          The same origin and destination can produce different burdens at
          different times.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          These are not final recommendations. They are comparable trade-offs.
        </p>
      </section>

      {/* ── Persona insights (merged from choose page) ── */}
      <section className="reveal-section mb-8">
        <PersonaInsightsPanel
          persona={persona}
          onPersonaChange={setPersona}
        />
      </section>

      {/* ── Journey context + Persona switch ── */}
      <section className="reveal-section card mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold">Your journey tonight</h2>
        </div>
        <p className="text-lg font-medium mb-3">
          <span style={{ color: "var(--champagne-gold)" }}>{originName}</span>
          {" → "}
          <span style={{ color: "var(--champagne-gold)" }}>{destinationName}</span>
        </p>
        {contexts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Viewing through:
            </span>
            {contexts.map((c) => (
              <span key={c} className="tag active text-xs">
                {CONTEXT_LABELS[c]}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Loading / error ── */}
      {loading && (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          Loading journey options...
        </div>
      )}
      {error && (
        <div className="text-center py-16">
          <p style={{ color: "var(--accent-rose)" }} className="mb-3">{error}</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Custom routes require a live backend. On the static site, only preset routes are available.
          </p>
          <Link href="/" className="btn-secondary px-5 py-2 text-sm">
            ← Back to preset journeys
          </Link>
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── Three-column route maps ── */}
          <section className="reveal-section mb-10">
            <h2 className="text-lg font-semibold mb-2">Route maps by departure time</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              The same route at different times. Support points thin out as
              the night progresses.
            </p>
            <div className="compare-maps-grid">
              {times.map((t, i) => {
                const j = data.options[t];
                if (!j) return null;
                const supportOpen = cardsData?.options[t]?.cards?.support_access?.total_support_open;
                return (
                  <RouteMap
                    key={t}
                    legs={j.legs}
                    label={TIME_LABELS[t] || t}
                    accent={TIME_COLORS[i % TIME_COLORS.length]}
                    supportCount={supportOpen != null ? Number(supportOpen) : undefined}
                  />
                );
              })}
            </div>
          </section>

          {/* ── Journey Timeline (comparative narrative panel) ── */}
          <section className="reveal-section mb-10">
            <JourneyTimelineCompare
              times={times}
              options={data.options}
              cardsByTime={cardsByTime}
            />
          </section>

          {/* ── Option cards ── */}
          <section className="reveal-section mb-10">
            <h2 className="text-lg font-semibold mb-4">
              Route options by departure time
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {times.map((time, i) => (
                <OptionCard
                  key={time}
                  time={time}
                  index={i}
                  journey={data.options[time]}
                  cards={cardsByTime[time]}
                  recovery={recoveryByTime[time] ?? null}
                  highlighted={highlightedMetrics}
                />
              ))}
            </div>
          </section>

          {/* ── Mechanisms (expands when the middle nav button is clicked) ── */}
          {mechanismsOpen && (
            <section
              ref={mechanismsRef}
              className="reveal-section mb-10"
            >
              <Mechanisms onClose={() => setMechanismsOpen(false)} />
            </section>
          )}

          {/* ── Bottom nav (back / mechanisms / view map) ── */}
          <div className="refl-nav reveal-section mb-6">
            <button
              type="button"
              className="refl-nav-btn refl-nav-secondary"
              onClick={() => router.back()}
            >
              &larr; Back
            </button>
            <button
              type="button"
              className={`refl-nav-btn ${mechanismsOpen ? "refl-nav-active" : ""}`}
              onClick={handleToggleMechanisms}
              aria-expanded={mechanismsOpen}
            >
              {mechanismsOpen ? "Hide Mechanisms" : "Mechanisms"}
            </button>
            <Link
              href="/overview"
              className="refl-nav-btn refl-nav-secondary"
            >
              View map &rarr;
            </Link>
          </div>

          {/* ── Footer ── */}
          <p
            className="reveal-section text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            A faster route is not always a lighter journey.
          </p>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div
          className="max-w-6xl mx-auto px-6 py-20 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
