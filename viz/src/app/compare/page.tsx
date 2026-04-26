"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useTransition, Suspense } from "react";
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
  type PresetPersonaId,
} from "@/components/PersonaSwitch";
import PersonaInsightsPanel, { type HourlyPoint } from "@/components/PersonaInsightsPanel";
import CustomRouteSelector from "@/components/CustomRouteSelector";
import WhatWeCompare from "@/components/WhatWeCompare";
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
  "14:00": "Daytime · 14:00",
  "19:00": "Evening · 19:00",
  "00:00": "Late Night · 24:00",
  "18:00": "☀️ Daytime · 18:00",
  "21:00": "🌆 Evening · 21:00",
  "22:30": "🌙 Late Night · 22:30",
  "23:00": "🌙 Late Night · 23:00",
  "23:30": "🌙 Late Night",
};

/** Map labels: emoji separate from text so colour CSS does not wash out the icons */
const ROUTE_MAP_TIME_PARTS: Record<string, { emoji: string; text: string }> = {
  "14:00": { emoji: "☀️", text: "Daytime · 14:00" },
  "19:00": { emoji: "🌆", text: "Evening · 19:00" },
  "00:00": { emoji: "🌙", text: "Late Night · 24:00" },
  "18:00": { emoji: "☀️", text: "Daytime · 18:00" },
  "21:00": { emoji: "🌆", text: "Evening · 21:00" },
  "22:30": { emoji: "🌙", text: "Late Night · 22:30" },
  "23:00": { emoji: "🌙", text: "Late Night · 23:00" },
  "23:30": { emoji: "🌙", text: "Late Night · 23:30" },
};

const TIME_COLORS = [
  "var(--champagne-gold)",
  "var(--accent-amber)",
  "var(--accent-rose)",
  "var(--accent-emerald)",
];

const DEFAULT_COMPARE_TIMES = "14:00,19:00,00:00";

const PERSONA_FOCUS_TO_METRICS: Record<string, string[]> = {
  functional_cost: ["duration", "fare", "walking", "transfers"],
  waiting_burden: ["waiting"],
  support_access: ["support"],
  activity_context: ["activity"],
  service_uncertainty: ["uncertainty"],
  safety_exposure: ["safety"],
};

const DENSE_COMPARE_FALLBACK_TIMES = [
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
  "00:00",
  "02:00",
] as const;

const DEFAULT_ORIGIN = "940GZZLUESQ";
const DEFAULT_ORIGIN_NAME = "Euston Square";
const DEFAULT_DEST = "HUBSVS";
const DEFAULT_DEST_NAME = "Seven Sisters";

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

function mergeCompareCards(
  requestedTimes: string[],
  primary: CompareCardsResult | null,
  fallbacks: Array<CompareCardsResult | null>,
): CompareCardsResult | null {
  const sources = [primary, ...fallbacks].filter(Boolean) as CompareCardsResult[];
  if (sources.length === 0) return null;

  const options = Object.fromEntries(
    requestedTimes.map((time) => {
      const matched = sources.find((source) => source.options[time]);
      return [time, matched?.options[time] ?? null];
    }),
  );

  return {
    origin: primary?.origin ?? sources[0].origin,
    destination: primary?.destination ?? sources[0].destination,
    options,
    note: primary?.note ?? sources[0].note,
  };
}

function deriveCompareResult(
  origin: string,
  destination: string,
  times: string[],
  cards: CompareCardsResult,
): CompareResult {
  return {
    origin,
    destination,
    options: Object.fromEntries(
      times.map((time) => [time, cards.options[time]?.journey ?? null]),
    ),
  };
}

/* ── Preset persona preload cache ─────────────────────────────
 * All 4 personas have fixed OD pairs and use the same default
 * times, so we can pre-fetch + pre-parse their static JSON
 * into memory on module load. Switching persona then reads
 * straight from this Map — zero network, zero JSON parse.
 * ──────────────────────────────────────────────────────────── */

interface PreloadedSnapshot {
  cardsData: CompareCardsResult;
  data: CompareResult;
}

const _preloadCache = new Map<string, PreloadedSnapshot>();
const _preloadPromises = new Map<string, Promise<PreloadedSnapshot | null>>();

function preloadCacheKey(origin: string, dest: string): string {
  return `${origin}__${dest}`;
}

function preloadOnePersona(
  origin: string,
  dest: string,
  times: string[],
): Promise<PreloadedSnapshot | null> {
  const key = preloadCacheKey(origin, dest);
  const existing = _preloadPromises.get(key);
  if (existing) return existing;

  const p = Promise.all([
    loadStaticCompareCards(origin, dest, times),
    loadStaticCompareCards(origin, dest, [...DENSE_COMPARE_FALLBACK_TIMES]),
  ]).then(([primary, dense]) => {
    const merged = mergeCompareCards(times, primary, [dense]);
    if (!merged) return null;
    const snapshot: PreloadedSnapshot = {
      cardsData: merged,
      data: deriveCompareResult(origin, dest, times, merged),
    };
    _preloadCache.set(key, snapshot);
    return snapshot;
  });

  _preloadPromises.set(key, p);
  return p;
}

const _defaultTimes = DEFAULT_COMPARE_TIMES.split(",");

function startPreloadAll() {
  for (const pid of Object.keys(PERSONA_ROUTES) as PresetPersonaId[]) {
    const r = PERSONA_ROUTES[pid];
    preloadOnePersona(r.origin, r.dest, _defaultTimes);
  }
}

if (typeof window !== "undefined") {
  startPreloadAll();
}

function getPresetPersona(
  origin?: string | null,
  destination?: string | null,
): PresetPersonaId | null {
  for (const personaId of Object.keys(PERSONA_ROUTES) as PresetPersonaId[]) {
    const preset = PERSONA_ROUTES[personaId];
    if (preset.origin === origin && preset.dest === destination) {
      return personaId;
    }
  }
  return null;
}

function mapThemeForTime(time: string): "day" | "evening" | "night" {
  const hour = Number(time.split(":")[0] || 0);
  if (hour >= 22 || hour < 6) return "night";
  if (hour < 22) return "evening";
  return "day";
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

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryOrigin = searchParams.get("origin") || DEFAULT_ORIGIN;
  const queryOriginName = searchParams.get("originName") || DEFAULT_ORIGIN_NAME;
  const queryDestination = searchParams.get("destination") || DEFAULT_DEST;
  const queryDestinationName = searchParams.get("destinationName") || DEFAULT_DEST_NAME;
  const timesParam = searchParams.get("times") || DEFAULT_COMPARE_TIMES;
  const contextsParam = searchParams.get("contexts") || "";

  const times = timesParam.split(",").filter(Boolean);
  const contexts = contextsParam.split(",").filter(Boolean) as ContextTag[];
  const [persona, setPersona] = useState<PersonaId | null>(() =>
    getPresetPersona(queryOrigin, queryDestination) ?? "student",
  );

  const activeRoute = persona && persona !== "custom"
    ? PERSONA_ROUTES[persona as PresetPersonaId]
    : undefined;
  const origin = activeRoute?.origin ?? queryOrigin;
  const originName = activeRoute?.oName ?? queryOriginName;
  const destination = activeRoute?.dest ?? queryDestination;
  const destinationName = activeRoute?.dName ?? queryDestinationName;

  const [data, setData] = useState<CompareResult | null>(null);
  const [cardsData, setCardsData] = useState<CompareCardsResult | null>(null);
  const [denseCardsData, setDenseCardsData] = useState<CompareCardsResult | null>(null);
  const [recoveryByTime, setRecoveryByTime] = useState<
    Record<string, JourneyRecoveryResult | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState("");
  const [mechanismsOpen, setMechanismsOpen] = useState(false);
  const [, startTransition] = useTransition();

  const revealRef = useReveal();
  const mechanismsRef = useRef<HTMLDivElement | null>(null);
  const compareRequestRef = useRef(0);

  const handlePersonaChange = useCallback((nextPersona: PersonaId | null) => {
    if (nextPersona) setPersona(nextPersona);
  }, []);

  const handleCustomRoute = useCallback(
    (o: string, oName: string, d: string, dName: string) => {
      setPersona("custom");
      const params = new URLSearchParams();
      params.set("origin", o);
      params.set("originName", oName);
      params.set("destination", d);
      params.set("destinationName", dName);
      params.set("times", "14:00,19:00,00:00");
      router.push(`/compare?${params.toString()}`);
    },
    [router],
  );

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
    const matched = getPresetPersona(queryOrigin, queryDestination);
    setPersona(matched ?? "custom");
  }, [queryDestination, queryOrigin]);

  useEffect(() => {
    if (!origin || !destination) return;
    const requestId = compareRequestRef.current + 1;
    compareRequestRef.current = requestId;
    const isCurrentRequest = () => compareRequestRef.current === requestId;

    setError("");

    const loadRecoveryProfiles = (compare: CompareResult) => {
      const entries = Object.entries(compare.options);
      if (entries.length === 0) return;
      Promise.all(
        entries.map(async ([t, j]) => {
          if (!j || !j.legs?.length) return [t, null] as const;
          try {
            const r = await api.getJourneyRecovery(j.legs, t);
            return [t, r] as const;
          } catch {
            return [t, null] as const;
          }
        }),
      ).then((pairs) => {
        if (!isCurrentRequest()) return;
        startTransition(() => {
          const map: Record<string, JourneyRecoveryResult | null> = {};
          for (const [t, r] of pairs) map[t] = r;
          setRecoveryByTime(map);
        });
      });
    };

    const applySnapshot = (snap: PreloadedSnapshot) => {
      setCardsData(snap.cardsData);
      setData(snap.data);
      setRecoveryByTime({});
      setLoading(false);
      setTransitioning(false);
      void loadRecoveryProfiles(snap.data);
    };

    // Fast path: check in-memory preload cache (sync, zero delay)
    const cacheKey = preloadCacheKey(origin, destination);
    const cached = _preloadCache.get(cacheKey);
    if (cached) {
      applySnapshot(cached);
      return;
    }

    // Medium path: preload promise in flight — wait for it
    const inflight = _preloadPromises.get(cacheKey);
    if (inflight) {
      const hasExistingData = data !== null;
      if (hasExistingData) setTransitioning(true);
      else setLoading(true);

      inflight.then((snap) => {
        if (!isCurrentRequest()) return;
        if (snap) {
          applySnapshot(snap);
        } else {
          setError("Could not load comparison data for this journey.");
          setLoading(false);
          setTransitioning(false);
        }
      });
      return;
    }

    // Slow path: non-preset route — fetch + optional live API
    const hasExistingData = data !== null;
    if (hasExistingData) setTransitioning(true);
    else setLoading(true);

    Promise.all([
      loadStaticCompareCards(origin, destination, times),
      loadStaticCompareCards(origin, destination, [...DENSE_COMPARE_FALLBACK_TIMES]),
    ])
      .then(([staticCards, denseCards]) => {
        if (!isCurrentRequest()) return;
        if (denseCards) setDenseCardsData(denseCards);
        const staticMerged = mergeCompareCards(times, staticCards, [denseCards]);

        if (staticMerged) {
          const snap: PreloadedSnapshot = {
            cardsData: staticMerged,
            data: deriveCompareResult(origin, destination, times, staticMerged),
          };
          _preloadCache.set(cacheKey, snap);
          applySnapshot(snap);
        }

        return api.compareCards(origin, destination, times)
          .then((liveCards) => {
            if (!isCurrentRequest()) return;
            const merged = mergeCompareCards(times, liveCards, [staticCards, denseCards]);
            if (!merged) {
              if (!staticMerged) throw new Error("Could not load comparison data for this journey.");
              return;
            }
            const snap: PreloadedSnapshot = {
              cardsData: merged,
              data: deriveCompareResult(origin, destination, times, merged),
            };
            _preloadCache.set(cacheKey, snap);
            startTransition(() => {
              setCardsData(snap.cardsData);
              setData(snap.data);
              setLoading(false);
              setTransitioning(false);
            });
            void loadRecoveryProfiles(snap.data);
          })
          .catch(() => {
            if (!isCurrentRequest()) return;
            if (!staticMerged) {
              throw new Error("Could not load comparison data for this journey.");
            }
          });
      })
      .catch((e) => {
        if (!isCurrentRequest()) return;
        setError(e.message);
        setLoading(false);
        setTransitioning(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, timesParam]);

  const activeDef = persona ? PERSONA_DEFS.find((p) => p.id === persona) : null;
  const highlightedMetrics = activeDef
    ? activeDef.focusDimensions.flatMap(
        (dimension) => PERSONA_FOCUS_TO_METRICS[dimension] ?? [],
      )
    : [];

  const cardsByTime: Record<string, Record<string, CardData> | undefined> = {};
  if (cardsData) {
    for (const t of times) {
      const opt = cardsData.options[t];
      if (opt) cardsByTime[t] = opt.cards;
    }
  }

  const customCurves = useMemo<Record<string, HourlyPoint | null> | null>(() => {
    if (persona !== "custom") return null;
    const sources = [denseCardsData, cardsData].filter(Boolean) as CompareCardsResult[];
    if (sources.length === 0) return null;

    const allTimes = [...DENSE_COMPARE_FALLBACK_TIMES, ...times];
    const seen = new Set<string>();
    const uniqueTimes = allTimes.filter((t) => { if (seen.has(t)) return false; seen.add(t); return true; });

    const result: Record<string, HourlyPoint | null> = {};
    for (const t of uniqueTimes) {
      const opt = sources.find((s) => s.options[t]?.cards)?.options[t];
      if (!opt?.cards) continue;
      const wb = opt.cards.waiting_burden;
      const sa = opt.cards.support_access;
      const fc = opt.cards.functional_cost;
      result[t] = {
        duration_min: Number(fc?.total_duration_min ?? 0),
        waiting_burden: Number(wb?.total_expected_wait_min ?? 0),
        support_open: Number(sa?.total_support_open ?? 0),
        recovery_penalty: Number(wb?.max_single_wait_min ?? 0),
      };
    }
    return Object.values(result).some((v) => v !== null) ? result : null;
  }, [persona, cardsData, denseCardsData, times]);

  return (
    <div className="compare-page">
      <div ref={revealRef} className="max-w-6xl mx-auto px-6 pt-20 pb-16">
      {/* ── Header ── */}
      <section className="reveal-section mb-12">
        <h1 className="text-3xl font-bold mb-3">
          Compare Journeys Across Time
        </h1>
        <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
          A journey is not only about where you go, but when you leave.
        </p>
        <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
          This prototype compares departure-time options through waiting,
          support, reliability, backup options, and route exposure — helping
          travellers understand the trade-offs before they set off.
        </p>
      </section>

      {/* ── Persona insights + journey context + custom route ── */}
      <section className="reveal-section mb-8">
        <PersonaInsightsPanel
          persona={persona}
          onPersonaChange={handlePersonaChange}
          customCurves={customCurves}
          headerContent={
            persona === "custom" ? (
              <div className="choose-journey-header choose-journey-header--custom">
                <CustomRouteSelector
                  currentOrigin={origin}
                  currentDestination={destination}
                  onSelect={handleCustomRoute}
                />
              </div>
            ) : (
              <div
                className="choose-journey-header--preset"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
              >
                <h2 className="choose-journey-tonight">Your journey tonight</h2>
                <p className="choose-journey-route">
                  <span>{originName}</span>
                  <span className="choose-journey-arrow">&rarr;</span>
                  <span>{destinationName}</span>
                </p>
                {contexts.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-1">
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
              </div>
            )
          }
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
        <div style={{
          opacity: transitioning ? 0.45 : 1,
          transition: "opacity 0.25s ease",
          pointerEvents: transitioning ? "none" : undefined,
        }}>
        <>
          {/* ── Three-column route maps ── */}
          <section className="reveal-section mb-10">
            <h2 className="choose-chart-title">What changes along the route?</h2>
            <p className="compare-route-desc">
              The route stays similar, but the support around it can change as the night gets later.
            </p>
            <div className="compare-maps-grid">
              {times.map((t, i) => {
                const j = data.options[t];
                if (!j) return null;
                const parts = ROUTE_MAP_TIME_PARTS[t];
                return (
                  <RouteMap
                    key={t}
                    legs={j.legs}
                    label={parts?.text ?? (TIME_LABELS[t] || t)}
                    labelEmoji={parts?.emoji}
                    accent={TIME_COLORS[i % TIME_COLORS.length]}
                    theme={mapThemeForTime(t)}
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
              origin={origin}
              destination={destination}
            />
          </section>

          {/* ── What we compare (metro-map indicator overview) ── */}
          <section className="reveal-section mb-10">
            <WhatWeCompare />
          </section>

          {/* ── Option cards (same panel + header pattern as Journey Timeline) ── */}
          <section className="reveal-section mb-10">
            <div className="jtc-panel">
              <div className="jtc-header">
                <h3 className="choose-chart-title">
                  What each departure time means
                </h3>
                <p className="compare-route-desc compare-route-desc--jtc">
                  Leaving later can change more than the route. These cards show how
                  time, cost, walking, waiting, transfers, and support nearby shift
                  across the day and night.
                </p>
              </div>
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
        </div>
      )}
      </div>
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
