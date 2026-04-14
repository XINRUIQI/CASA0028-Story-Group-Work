"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TagSelector from "@/components/TagSelector";
import JourneyTimeline from "@/components/JourneyTimeline";
import ComparisonCards from "@/components/ComparisonCards";
import MissedConnection from "@/components/MissedConnection";
import OptionCard from "@/components/OptionCard";
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
  "var(--accent-blue)",
  "var(--accent-amber)",
  "var(--accent-rose)",
  "var(--accent-emerald)",
];

function CompareContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || "";
  const originName = searchParams.get("originName") || origin;
  const destination = searchParams.get("destination") || "";
  const destinationName = searchParams.get("destinationName") || destination;
  const timesParam = searchParams.get("times") || "18:00,21:00,23:30";
  const contextsParam = searchParams.get("contexts") || "";

  const times = timesParam.split(",").filter(Boolean);
  const contexts = contextsParam.split(",").filter(Boolean) as ContextTag[];
  const [priorities, setPriorities] = useState<Priority[]>([]);

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
      api.compareCards(origin, destination, times).catch(() => null),
    ])
      .then(([compare, cards]) => {
        setData(compare);
        setCardsData(cards);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, timesParam]);

  const highlightedMetrics = priorities.map((p) => PRIORITY_TO_METRIC[p]);

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
        <p className="section-label">Same path, different demands</p>
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

      {/* ── Journey context ── */}
      <section className="reveal-section card mb-6">
        <h2 className="text-sm font-semibold mb-2">Your journey tonight</h2>
        <p className="text-lg font-medium mb-2">
          <span style={{ color: "var(--accent-blue)" }}>{originName}</span>
          {" → "}
          <span style={{ color: "var(--accent-blue)" }}>{destinationName}</span>
        </p>
        {contexts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
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
        <div className="text-center py-16" style={{ color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}

      {data && !loading && (
        <>
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
                    label={t}
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
                Six dimensions, side by side. No single score.
              </p>
              <ComparisonCards cardsByTime={cardsByTime} times={times} />
            </section>
          )}

          {/* ── Missed connection simulator ── */}
          <section className="reveal-section mb-10">
            <h2 className="text-lg font-semibold mb-4">
              Recovery: what if you miss a connection?
            </h2>

            {/* Time selector for simulation */}
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
                  {t}
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
