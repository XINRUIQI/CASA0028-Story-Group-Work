"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TagSelector from "@/components/TagSelector";
import JourneyTimeline from "@/components/JourneyTimeline";
import ComparisonCards from "@/components/ComparisonCards";
import MissedConnection from "@/components/MissedConnection";
import OptionCard from "@/components/OptionCard";
import RouteMap from "@/components/RouteMap";
import PersonaSwitch, {
  PERSONA_DEFS,
  type PersonaId,
} from "@/components/PersonaSwitch";
import { useReveal } from "@/lib/useReveal";
import {
  PRIORITY_LABELS,
  type Priority,
  type ContextTag,
  CONTEXT_LABELS,
} from "@/lib/types";
import {
  api,
  type CompareResult,
  type CompareCardsResult,
  type CardData,
} from "@/lib/api";
import {
  COMPARE_TIMES,
  FIXED_ROUTE_PRESETS,
  TIME_OF_DAY_LABELS,
  encodeCompareTimes,
  formatDisplayTime,
} from "@/lib/journeyPresets";

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value: value as Priority,
  label,
}));

const PRIORITY_TO_METRIC: Record<Priority, string> = {
  "less-waiting": "waiting",
  "less-walking": "walking",
  "fewer-interchanges": "transfers",
  "more-support": "support",
  "busier-surroundings": "activity",
  "lower-uncertainty": "uncertainty",
};

const TIME_COLORS = [
  "var(--champagne-gold)",
  "var(--accent-amber)",
  "var(--accent-rose)",
  "var(--accent-emerald)",
];

function mapThemeForTime(time: string): "day" | "evening" | "night" {
  const hour = Number(time.split(":")[0] || 0);
  if (hour < 20) return "day";
  if (hour < 22) return "evening";
  return "night";
}

function formatSignedMetric(value: unknown): string | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}`;
}

function buildRouteSupportSummary(
  supportCard?: CardData,
  activityCard?: CardData,
): string | undefined {
  if (!supportCard && !activityCard) return undefined;

  const parts: string[] = [];
  const supportCount = Number(supportCard?.total_support_open);
  if (Number.isFinite(supportCount)) {
    parts.push(`${supportCount} open support places`);
  }

  const supportIndex = formatSignedMetric(supportCard?.route_support_index);
  if (supportIndex) {
    parts.push(`support ${supportIndex}`);
  }

  const activityIndex = formatSignedMetric(activityCard?.route_activity_index);
  if (activityIndex) {
    parts.push(`activity ${activityIndex}`);
  }

  const venueDensity = Number(activityCard?.route_venue_density);
  if (Number.isFinite(venueDensity)) {
    parts.push(`${venueDensity.toFixed(1)} venues/km²`);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

async function loadStaticCompareCards(
  origin: string,
  destination: string,
  times: string[],
): Promise<CompareCardsResult | null> {
  const encodedTimes = times.join(",").replace(/:/g, "-").replace(/,/g, "_");
  const path = `/static-data/compare-cards/${destination}__${origin}__${encodedTimes}.json`;
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return (await response.json()) as CompareCardsResult;
  } catch {
    return null;
  }
}

const DEFAULT_ORIGIN = FIXED_ROUTE_PRESETS.student.origin;
const DEFAULT_ORIGIN_NAME = FIXED_ROUTE_PRESETS.student.originName;
const DEFAULT_DEST = FIXED_ROUTE_PRESETS.student.destination;
const DEFAULT_DEST_NAME = FIXED_ROUTE_PRESETS.student.destinationName;

function CompareContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || DEFAULT_ORIGIN;
  const originName = searchParams.get("originName") || (searchParams.get("origin") ? searchParams.get("origin")! : DEFAULT_ORIGIN_NAME);
  const destination = searchParams.get("destination") || DEFAULT_DEST;
  const destinationName = searchParams.get("destinationName") || (searchParams.get("destination") ? searchParams.get("destination")! : DEFAULT_DEST_NAME);
  const timesParam = searchParams.get("times") || encodeCompareTimes(COMPARE_TIMES);
  const contextsParam = searchParams.get("contexts") || "";

  const times = timesParam.split(",").filter(Boolean);
  const contexts = contextsParam.split(",").filter(Boolean) as ContextTag[];
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [persona, setPersona] = useState<PersonaId>("student");

  const [data, setData] = useState<CompareResult | null>(null);
  const [cardsData, setCardsData] = useState<CompareCardsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTime, setSelectedTime] = useState<string>(times[0] || "");

  const revealRef = useReveal();

  useEffect(() => {
    if (!origin || !destination) return;
    setLoading(true);
    setError("");

    Promise.all([
      api.compareJourney(origin, destination, times),
      api.compareCards(origin, destination, times).catch(() =>
        loadStaticCompareCards(origin, destination, times),
      ),
    ])
      .then(([compare, cards]) => {
        setData(compare);
        setCardsData(cards);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, timesParam]);

  const activeDef = PERSONA_DEFS.find((p) => p.id === persona)!;
  const personaMetrics = activeDef.focusDimensions.map((d) =>
    d.replace(/_/g, " ").split(" ")[0],
  );
  const highlightedMetrics = priorities.length > 0
    ? priorities.map((p) => PRIORITY_TO_METRIC[p])
    : personaMetrics;

  const cardsByTime: Record<string, Record<string, CardData> | undefined> = {};
  if (cardsData) {
    for (const t of times) {
      const opt = cardsData.options[t];
      if (opt) cardsByTime[t] = opt.cards;
    }
  }

  const selectedJourney = data?.options[selectedTime] ?? null;

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

      {/* ── Persona perspective switch ── */}
      <section className="reveal-section mb-8">
        <h2 className="text-lg font-semibold mb-4">Traveller perspective</h2>
        <PersonaSwitch active={persona} onChange={setPersona} />
      </section>

      {/* ── Priority selector ── */}
      <section className="reveal-section card mb-8">
        <h2 className="font-semibold mb-2">What matters most tonight?</h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Selecting a priority highlights relevant dimensions. It does not
          produce a single &ldquo;correct&rdquo; answer.
        </p>
        <TagSelector
          options={PRIORITY_OPTIONS}
          selected={priorities}
          onChange={setPriorities}
        />
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
                const supportCard = cardsData?.options[t]?.cards?.support_access;
                const activityCard = cardsData?.options[t]?.cards?.activity_context;
                const supportOpen = supportCard?.total_support_open;
                return (
                  <RouteMap
                    key={t}
                    legs={j.legs}
                    label={TIME_OF_DAY_LABELS[t] || formatDisplayTime(t)}
                    accent={TIME_COLORS[i % TIME_COLORS.length]}
                    supportCount={supportOpen != null ? Number(supportOpen) : undefined}
                    supportSummary={buildRouteSupportSummary(supportCard, activityCard)}
                    theme={mapThemeForTime(t)}
                  />
                );
              })}
            </div>
          </section>

          {/* ── Journey Timelines ── */}
          <section className="reveal-section mb-10">
            <h2 className="text-lg font-semibold mb-4">Journey timeline</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Not just total time — see which segment gets heavier after dark.
            </p>
            <div className="timeline-stack">
              {times.map((t, i) => {
                const j = data.options[t];
                if (!j) return null;
                return (
                  <JourneyTimeline
                    key={t}
                    legs={j.legs}
                    totalDuration={j.duration_min}
                    label={formatDisplayTime(t)}
                    accent={TIME_COLORS[i % TIME_COLORS.length]}
                  />
                );
              })}
            </div>
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
                  cards={cardsData?.options[time]?.cards}
                  origin={origin}
                  destination={destination}
                  highlighted={highlightedMetrics}
                />
              ))}
            </div>
          </section>

          {/* ── Six Comparison Cards ── */}
          {Object.keys(cardsByTime).length > 0 && (
            <section className="reveal-section mb-10">
              <h2 className="text-lg font-semibold mb-2">
                Trade-off comparison
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                Seven dimensions, side by side. No single score.
              </p>
              <ComparisonCards cardsByTime={cardsByTime} times={times} />
            </section>
          )}

          {/* ── Missed connection simulator ── */}
          <section className="reveal-section mb-10">
            <h2 className="text-lg font-semibold mb-4">
              Recovery: what if you miss a connection?
            </h2>

            <div className="flex gap-2 mb-4">
              {times.map((t, i) => (
                <button
                  key={t}
                  className={`tag ${selectedTime === t ? "active" : ""}`}
                  onClick={() => setSelectedTime(t)}
                  style={
                    selectedTime === t
                      ? { borderColor: TIME_COLORS[i], color: TIME_COLORS[i] }
                      : undefined
                  }
                >
                  {`${TIME_OF_DAY_LABELS[t] || ""} ${formatDisplayTime(t)}`.trim()}
                </button>
              ))}
            </div>

            {selectedJourney && (
              <MissedConnection legs={selectedJourney.legs} time={selectedTime} />
            )}
          </section>

          {/* ── What changes most ── */}
          <section className="reveal-section card mb-10">
            <h3 className="font-semibold mb-3">
              What changes most across time?
            </h3>
            <ul className="space-y-2">
              <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-amber)" }}>●</span>{" "}
                Waiting increases most after 21:00
              </li>
              <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-amber)" }}>●</span>{" "}
                Nearby support drops sharply later in the evening
              </li>
              <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-amber)" }}>●</span>{" "}
                Later departures are easier to miss and harder to recover from
              </li>
            </ul>
          </section>

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
