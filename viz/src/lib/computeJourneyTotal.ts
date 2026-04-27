import type { Journey, CardData } from "./api";

/**
 * Compute the effective journey duration including explicit wait segments.
 *
 * Walk / ride durations come from TfL legs; wait durations come from the
 * backend `waiting_burden.leg_waits` (headway ÷ 2) or a time‑of‑day
 * heuristic when that data is absent.
 *
 * Returns `max(segmentSum, journey.duration_min)` so the value is never
 * smaller than TfL's own estimate.
 */

interface LegWait {
  leg_index: number;
  expected_wait_min: number;
}

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

export function computeJourneyTotal(
  journey: Journey,
  time: string,
  cards?: Record<string, CardData>,
): number {
  const wb = cards?.waiting_burden as
    | (CardData & { leg_waits?: LegWait[] })
    | undefined;
  const legWaits = Array.isArray(wb?.leg_waits) ? wb!.leg_waits! : null;

  const waitByIndex = new Map<number, LegWait>();
  (legWaits ?? []).forEach((lw) => waitByIndex.set(lw.leg_index, lw));

  const legs = journey.legs;
  let segTotal = 0;
  let rideCount = 0;
  let prevKind = "";

  legs.forEach((leg, i) => {
    const isFirst = i === 0;
    const isLast = i === legs.length - 1;

    if (leg.is_walking) {
      if (isFirst || isLast) {
        segTotal += Math.max(leg.duration_min, 1);
        prevKind = "walk";
      } else {
        segTotal += Math.max(leg.duration_min, 2);
        prevKind = "transfer";
      }
      return;
    }

    const real = waitByIndex.get(i);
    const waitMin = real
      ? Math.max(real.expected_wait_min, 1)
      : rideCount === 0
        ? firstWaitFallback(time)
        : transferWaitFallback(time);

    if (prevKind !== "wait") {
      segTotal += waitMin;
      prevKind = "wait";
    }

    segTotal += Math.max(leg.duration_min, 1);
    prevKind = "ride";
    rideCount += 1;
  });

  return Math.max(segTotal, journey.duration_min);
}
