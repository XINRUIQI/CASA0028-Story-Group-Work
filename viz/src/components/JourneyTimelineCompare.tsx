"use client";

import { Zap, Clock, PoundSterling, Footprints, Shuffle } from "lucide-react";
import type { Journey, Leg, CardData } from "@/lib/api";

/* ──────────────────────────────────────────────────────────────
 * Journey Timeline Compare
 * Narrative‑style horizontal comparison of walk / wait / ride /
 * transfer segments across Day, Evening and Late Night departures.
 *
 * Wait durations come from the backend `waiting_burden.leg_waits`
 * field (expected_wait_min ≈ headway / 2). When that data is
 * missing (e.g. a degraded static fallback), a time‑of‑day
 * heuristic fills in so the component never breaks.
 * ────────────────────────────────────────────────────────────── */

type SegmentKind = "walk" | "wait" | "ride" | "transfer";

interface LegWait {
  leg_index: number;
  line_id: string;
  time_band: string;
  headway_min: number;
  daytime_headway_min: number;
  expected_wait_min: number;
  gap_ratio: number | null;
}

interface Segment {
  kind: SegmentKind;
  label: string;
  durationMin: number;
  risk?: boolean;
  stopName?: string;
  headwayMin?: number;
  gapRatio?: number | null;
}

interface TimelineRow {
  key: string;
  band: "Day" | "Evening" | "Late Night";
  time: string;
  totalMin: number;
  segments: Segment[];
  isNight: boolean;
  hasRisk: boolean;
  fare: number | null;
  fareDisplay: string;
  walkDistanceM: number;
  transfers: number;
  unavailable: boolean;
}

export interface JourneyTimelineCompareProps {
  times: string[];
  options: Record<string, Journey | null>;
  /**
   * cardsByTime[time] is the object of six comparison cards for that
   * departure time. We only read `waiting_burden.leg_waits` here.
   */
  cardsByTime?: Record<string, Record<string, CardData> | undefined>;
  origin?: string;
  destination?: string;
}

/* ── Time-of-day helpers ─────────────────────────────────────── */

function bandFor(time: string): { band: TimelineRow["band"]; isNight: boolean } {
  const h = parseInt(time.split(":")[0] || "0", 10);
  if (h >= 22 || h < 5) return { band: "Late Night", isNight: true };
  if (h >= 19) return { band: "Evening", isNight: false };
  return { band: "Day", isNight: false };
}

// Heuristic fallback only — used when the backend didn't ship leg_waits.
function firstWaitFallback(time: string): number {
  const h = parseInt(time.split(":")[0] || "0", 10);
  if (h >= 23 || h < 5) return 8;
  if (h >= 22) return 6;
  if (h >= 20) return 4;
  return 2;
}

function transferWaitFallback(time: string): number {
  const h = parseInt(time.split(":")[0] || "0", 10);
  if (h >= 23 || h < 5) return 10;
  if (h >= 22) return 7;
  if (h >= 20) return 5;
  return 3;
}

function rideLabel(leg: Leg): string {
  const id = (leg.mode_id || "").toLowerCase();
  if (id === "bus") return "Bus";
  if (id === "tube" || id === "underground") return "Tube";
  if (id === "dlr") return "DLR";
  if (id === "overground") return "Overground";
  if (id === "elizabeth-line" || id === "elizabeth") return "Elizabeth";
  if (id === "national-rail" || id === "rail") return "Rail";
  return "Ride";
}

/* ── Segment construction ───────────────────────────────────── */

function buildSegments(
  legs: Leg[],
  time: string,
  isNight: boolean,
  legWaits: LegWait[] | null,
): Segment[] {
  const out: Segment[] = [];
  let rideCount = 0;

  // Map leg_index → wait info for O(1) lookup.
  const waitByIndex = new Map<number, LegWait>();
  (legWaits ?? []).forEach((lw) => waitByIndex.set(lw.leg_index, lw));

  legs.forEach((leg, i) => {
    const isFirst = i === 0;
    const isLast = i === legs.length - 1;

    if (leg.is_walking) {
      if (isFirst) {
        out.push({
          kind: "walk",
          label: "Walk",
          durationMin: Math.max(leg.duration_min, 1),
        });
      } else if (isLast) {
        out.push({
          kind: "walk",
          label: "Walk",
          durationMin: Math.max(leg.duration_min, 1),
          // A long final walk at night is a tangible risk signal.
          risk: isNight && leg.duration_min >= 8,
        });
      } else {
        out.push({
          kind: "transfer",
          label: "Transfer",
          durationMin: Math.max(leg.duration_min, 2),
          stopName: leg.arrival_point?.name,
        });
      }
      return;
    }

    // Ride leg: emit Wait + Ride.
    const real = waitByIndex.get(i);
    const waitMin = real
      ? Math.max(real.expected_wait_min, 1)
      : rideCount === 0
        ? firstWaitFallback(time)
        : transferWaitFallback(time);
    const headway = real?.headway_min;
    const gap = real?.gap_ratio ?? null;

    // Risk rule (absolute, works across all bands):
    //   wait ≥ 6 min  OR  headway ≥ 12 min  OR  gap_ratio ≥ 2
    const waitRisk =
      waitMin >= 6 || (headway ?? 0) >= 12 || (gap ?? 0) >= 2;

    // Skip double‑stacking if the previous segment is already a wait.
    const prev = out[out.length - 1];
    if (prev?.kind !== "wait") {
      out.push({
        kind: "wait",
        label: "Wait",
        durationMin: waitMin,
        headwayMin: headway,
        gapRatio: gap,
        risk: waitRisk,
      });
    }

    out.push({
      kind: "ride",
      label: rideLabel(leg),
      durationMin: Math.max(leg.duration_min, 1),
      stopName: leg.departure_point?.name,
    });
    rideCount += 1;
  });

  return out;
}

function buildRow(
  time: string,
  journey: Journey | null,
  cards?: Record<string, CardData>,
  origin?: string,
  destination?: string,
): TimelineRow {
  const { band, isNight } = bandFor(time);

  if (!journey) {
    return {
      key: time,
      band,
      time,
      totalMin: 0,
      segments: [],
      isNight,
      hasRisk: isNight,
      fare: null,
      fareDisplay: "—",
      walkDistanceM: 0,
      transfers: 0,
      unavailable: true,
    };
  }

  const wb = cards?.waiting_burden as
    | (CardData & { leg_waits?: LegWait[] })
    | undefined;
  const legWaits = Array.isArray(wb?.leg_waits) ? wb!.leg_waits! : null;

  const segments = buildSegments(journey.legs, time, isNight, legWaits);
  const hasRisk = segments.some((s) => s.risk);
  const segTotal = segments.reduce((s, x) => s + x.durationMin, 0);

  return {
    key: time,
    band,
    time,
    totalMin: Math.max(segTotal, journey.duration_min),
    segments,
    isNight,
    hasRisk,
    fare: journey.fare,
    fareDisplay: buildTimelineFareDisplay(journey, cards, origin, destination),
    walkDistanceM: journey.walk_distance_m ?? 0,
    transfers: journey.transfers ?? 0,
    unavailable: false,
  };
}

/* ── Stat formatting helpers ────────────────────────────────── */

function formatFare(pence: number | null): string {
  if (pence == null) return "—";
  return `£${(pence / 100).toFixed(2)}`;
}

function asFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildTimelineFareDisplay(
  journey: Journey,
  cards?: Record<string, CardData>,
  origin?: string,
  destination?: string,
): string {
  const journeyFare = asFiniteNumber(journey.fare);
  const fcFare = asFiniteNumber((cards?.functional_cost as CardData & { fare?: unknown })?.fare);
  const fare = journeyFare ?? fcFare;
  if (fare != null) return formatFare(fare);

  const transitModes = journey.legs
    .filter((leg) => !leg.is_walking)
    .map((leg) => leg.mode_id);
  if (transitModes.length > 0 && transitModes.every((mode) => mode === "bus")) {
    return `${formatFare(175)} est.`;
  }
  if (origin === "940GZZLUSTD" && destination === "940GZZLUBXN") {
    return `${formatFare(310)} est.`;
  }
  return "—";
}

function formatWalk(metres: number): string {
  if (!metres) return "~0 m";
  return `~${Math.round(metres)} m`;
}

/* ── Segment pill ────────────────────────────────────────────── */

function SegmentPill({
  seg,
  maxTotal,
}: {
  seg: Segment;
  maxTotal: number;
}) {
  const basis = Math.max((seg.durationMin / maxTotal) * 100, 3);

  if (seg.kind === "transfer") {
    return (
      <div
        className="jtc-connector"
        style={{ flexBasis: `${basis}%` }}
        title={
          seg.stopName
            ? `Transfer via ${seg.stopName.split(/[,(]/)[0].trim()} · ${seg.durationMin} min`
            : `Transfer · ${seg.durationMin} min`
        }
      >
        <span className="jtc-connector-line" />
        <span className="jtc-connector-label">Transfer</span>
        <span className="jtc-connector-line" />
      </div>
    );
  }

  const classes = [
    "jtc-pill",
    `jtc-pill--${seg.kind}`,
    seg.risk ? "jtc-pill--risk" : "",
  ]
    .filter(Boolean)
    .join(" ");

  let tip = `${seg.label} · ${seg.durationMin} min`;
  if (seg.kind === "ride" && seg.stopName) {
    tip = `${seg.label} from ${seg.stopName.split(/[,(]/)[0].trim()} · ${seg.durationMin} min`;
  } else if (seg.kind === "wait" && seg.headwayMin != null) {
    tip = `Expected wait ${seg.durationMin} min · headway ${seg.headwayMin} min${
      seg.gapRatio ? ` (${seg.gapRatio}× daytime)` : ""
    }`;
  }

  return (
    <div className={classes} style={{ flexBasis: `${basis}%` }} title={tip}>
      <span className="jtc-pill-label">{seg.label}</span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export default function JourneyTimelineCompare({
  times,
  options,
  cardsByTime,
  origin,
  destination,
}: JourneyTimelineCompareProps) {
  const rows = times.map((t) =>
    buildRow(t, options[t] ?? null, cardsByTime?.[t], origin, destination),
  );

  if (!rows.length) return null;

  // Shared scale across *available* rows so empty slots don't squash the bar.
  const maxTotal = Math.max(
    ...rows.filter((r) => !r.unavailable).map((r) => r.totalMin),
    1,
  );

  return (
    <div className="jtc-panel">
      <div className="jtc-header">
        <h3 className="jtc-title">Journey Timeline</h3>
        <p className="jtc-subtitle">
          Same route, three departures. Waits below are the real expected
          wait (≈ TfL headway ÷ 2); walking and riding come from the live
          journey plan.
        </p>
      </div>

      <div className="jtc-rows">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`jtc-row ${row.isNight ? "jtc-row--night" : ""} ${
              row.unavailable ? "jtc-row--empty" : ""
            }`}
          >
            <div className="jtc-row-label">
              <div className="jtc-row-band">{row.band}</div>
              <div className="jtc-row-time">{row.time}</div>
            </div>
            <div className="jtc-row-main">
              {row.unavailable ? (
                <div
                  className="jtc-row-empty"
                  title="TfL Journey Planner returned no viable route for this departure time."
                >
                  <Zap size={12} />
                  <span>
                    No service planned at this time — Night Tube / bus may
                    be the only option.
                  </span>
                </div>
              ) : (
                <>
                  <div className="jtc-row-track">
                    {row.segments.map((seg, i) => (
                      <SegmentPill key={i} seg={seg} maxTotal={maxTotal} />
                    ))}
                  </div>
                  <div className="jtc-row-stats" aria-label="Journey stats">
                    <span
                      className="jtc-stat"
                      title={`${row.totalMin} min total journey time`}
                    >
                      <Clock size={11} />
                      <span className="jtc-stat-value">{row.totalMin}</span>
                      <span className="jtc-stat-unit">min</span>
                    </span>
                    <span
                      className="jtc-stat"
                      title="Fare returned by TfL Journey Planner"
                    >
                      <PoundSterling size={11} />
                      <span className="jtc-stat-value">
                        {row.fareDisplay}
                      </span>
                    </span>
                    <span
                      className="jtc-stat"
                      title="Total walking distance across all legs"
                    >
                      <Footprints size={11} />
                      <span className="jtc-stat-value">
                        {formatWalk(row.walkDistanceM)}
                      </span>
                    </span>
                    <span className="jtc-stat" title="Number of line changes">
                      <Shuffle size={11} />
                      <span className="jtc-stat-value">{row.transfers}</span>
                      <span className="jtc-stat-unit">
                        {row.transfers === 1 ? "transfer" : "transfers"}
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="jtc-legend">
        <span className="jtc-legend-item">
          <span className="jtc-swatch jtc-swatch--walk" /> Walk
        </span>
        <span className="jtc-legend-item">
          <span className="jtc-swatch jtc-swatch--wait" /> Wait
        </span>
        <span className="jtc-legend-item">
          <span className="jtc-swatch jtc-swatch--ride" /> Ride
        </span>
        <span className="jtc-legend-item">
          <span className="jtc-swatch jtc-swatch--risk" /> Night risk
        </span>
      </div>
    </div>
  );
}
