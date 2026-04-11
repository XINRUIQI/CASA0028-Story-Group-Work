"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TagSelector from "@/components/TagSelector";
import OptionCard from "@/components/OptionCard";
import { PRIORITY_LABELS, type Priority, type ContextTag, CONTEXT_LABELS } from "@/lib/types";
import { api, type CompareResult } from "@/lib/api";

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

function CompareContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || "";
  const originName = searchParams.get("originName") || origin;
  const destination = searchParams.get("destination") || "";
  const destinationName = searchParams.get("destinationName") || destination;
  const timesParam = searchParams.get("times") || "18:00,21:00,22:30";
  const contextsParam = searchParams.get("contexts") || "";

  const times = timesParam.split(",").filter(Boolean);
  const contexts = contextsParam.split(",").filter(Boolean) as ContextTag[];
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [data, setData] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!origin || !destination) return;
    setLoading(true);
    api
      .compareJourney(origin, destination, times)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, timesParam]);

  const highlightedMetrics = priorities.map((p) => PRIORITY_TO_METRIC[p]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Compare Options, Not Just Routes
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          The same origin and destination can produce different burdens at
          different times.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          These are not final recommendations. They are comparable options.
        </p>
      </section>

      {/* Journey context */}
      <section className="card mb-6">
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

      {/* Priority selector */}
      <section className="card mb-8">
        <h2 className="font-semibold mb-2">What matters most tonight?</h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Selecting a priority reorders and highlights options. It does not
          produce a single &ldquo;correct&rdquo; answer.
        </p>
        <TagSelector
          options={PRIORITY_OPTIONS}
          selected={priorities}
          onChange={setPriorities}
        />
      </section>

      {/* Option cards */}
      {loading && (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          Loading journey options...
        </div>
      )}
      {error && (
        <div className="text-center py-12" style={{ color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}
      {data && !loading && (
        <section className="grid md:grid-cols-3 gap-4 mb-8">
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
        </section>
      )}

      {/* Comparison strip */}
      {data && !loading && (
        <section className="card mb-8">
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
      )}

      {/* Footer */}
      <p
        className="text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        A faster route is not always a lighter journey.
      </p>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
