const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const STATIC_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Build a deterministic file path for a pre-fetched static JSON response.
 * Must stay in sync with data/scripts/prefetch_static.py → static_key().
 */
function staticKey(path: string, params?: Record<string, string>): string | null {
  const dir = path.replace(/^\//, "").replace(/\//g, "-");
  if (!params || Object.keys(params).length === 0) return `${dir}.json`;
  if (Object.values(params).some((v) => v.length > 200)) return null;
  const vals = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v.replace(/:/g, "-").replace(/,/g, "_"))
    .join("__");
  return `${dir}/${vals}.json`;
}

async function fetchJSON<T>(
  path: string,
  params?: Record<string, string>,
  timeoutMs = 10_000,
): Promise<T> {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json();
  } catch (liveErr) {
    const key = staticKey(path, params);
    if (key) {
      try {
        const fallback = await fetch(`${STATIC_PREFIX}/static-data/${key}`);
        if (fallback.ok) return fallback.json();
      } catch { /* static fallback unavailable */ }
    }
    throw liveErr;
  }
}

/* ── Types ────────────────────────────────────────────────────── */

export interface StopPointMatch {
  name: string;
  naptan_id: string;
  lat: number | null;
  lon: number | null;
  modes: string[];
}

export interface Leg {
  mode: string;
  mode_id: string;
  is_walking: boolean;
  duration_min: number;
  summary: string;
  departure_point: {
    name: string;
    naptan_id: string;
    lat: number | null;
    lon: number | null;
  };
  arrival_point: {
    name: string;
    naptan_id: string;
    lat: number | null;
    lon: number | null;
  };
  line_id: string;
  path: string;
  distance_m?: number;
}

export interface Journey {
  duration_min: number;
  fare: number | null;
  walk_distance_m: number;
  transfers: number;
  legs: Leg[];
  arrival_time: string;
  departure_time: string;
}

export interface CompareResult {
  origin: string;
  destination: string;
  options: Record<string, Journey | null>;
}

export interface SupportCard {
  naptan_id: string;
  stop_name?: string;
  mode?: string;
  lat: number;
  lon: number;
  time?: string;
  shelter: boolean;
  step_free: string;
  toilet_in_station: boolean;
  lift_disruption: boolean;
  nearby_shops_total: number;
  nearby_shops_open: number;
  nearby_pharmacy_total: number;
  nearby_pharmacy_open: number;
  nearby_healthcare_total: number;
  nearby_healthcare_open: number;
  nearby_toilets: number;
  nearby_aed: number;
  lamp_density: number;
  total_support_open: number;
  total_support_all: number;
  support_open_ratio: number | null;
}

export interface WaitingBurden {
  naptan_id: string;
  line_id: string;
  time_band: string;
  headway_min: number;
  daytime_headway_min: number;
  expected_wait_min: number;
  gap_ratio: number | null;
  missed_penalty_min: number;
  burden_label: string;
}

export interface UncertaintyResult {
  line_id: string;
  time: string;
  uncertainty_level: string;
  has_disruption: boolean;
  headway_gap_ratio: number | null;
  explanation: string;
  note: string;
}

export interface CardData {
  card: string;
  [key: string]: unknown;
}

export interface CompareCardsResult {
  origin: string;
  destination: string;
  options: Record<string, {
    journey: Journey;
    cards: Record<string, CardData>;
  } | null>;
  note: string;
}

export interface MissedConnectionResult {
  naptan_id: string;
  line_id: string;
  time: string;
  extra_wait_min: number;
  daytime_extra_wait_min: number;
  wait_penalty_ratio: number | null;
  fallback_lines: number;
  recovery_difficulty: string;
  explanation: string;
}

export interface JourneyRecoveryResult {
  time: string;
  worst_case: {
    leg_index: number;
    stop_name: string;
    line_id: string;
    extra_wait_min: number;
    fallback_lines: number;
    recovery_difficulty: string;
  } | null;
  mean_penalty_min: number;
  overall_resilience: string;
  transfers: Array<{
    leg_index: number;
    stop_name: string;
    line_id: string;
    extra_wait_min: number;
    fallback_lines: number;
    recovery_difficulty: string;
  }>;
}

export interface FairnessZone {
  name: string;
  day_value: number;
  night_value: number;
  drop_ratio: number;
  percentile: number;
}

export interface FairnessLayerInfo {
  id: string;
  available: boolean;
  zone_count: number;
}

export interface FairnessSummaryDim {
  available: boolean;
  zone_count?: number;
  mean_drop?: number;
  max_drop?: number;
  min_drop?: number;
}

/* ── API methods ──────────────────────────────────────────────── */

export const api = {
  searchStopPoint(query: string) {
    return fetchJSON<{ matches: StopPointMatch[] }>("/journey/stoppoint/search", { query });
  },

  planJourney(origin: string, destination: string, time: string) {
    return fetchJSON<{ journeys: Journey[] }>("/journey/plan", { origin, destination, time });
  },

  compareJourney(origin: string, destination: string, times: string[]) {
    return fetchJSON<CompareResult>("/journey/compare", {
      origin,
      destination,
      times: times.join(","),
    });
  },

  compareCards(origin: string, destination: string, times: string[]) {
    return fetchJSON<CompareCardsResult>("/compare/cards", {
      origin,
      destination,
      times: times.join(","),
    }, 40_000);
  },

  getRouteSupport(legs: Leg[], time?: string) {
    const params: Record<string, string> = { legs_json: JSON.stringify(legs) };
    if (time) params.time = time;
    return fetchJSON<{ support_cards: SupportCard[] }>("/support/route", params);
  },

  getWaitingBurden(naptanId: string, lineId: string, time: string) {
    return fetchJSON<WaitingBurden>("/waiting/burden", {
      naptan_id: naptanId,
      line_id: lineId,
      time,
    });
  },

  getUncertainty(lineId: string, time: string) {
    return fetchJSON<UncertaintyResult>("/waiting/uncertainty", {
      line_id: lineId,
      time,
    });
  },

  getJourneyRecovery(legs: Leg[], time: string) {
    return fetchJSON<JourneyRecoveryResult>("/recovery/journey-recovery", {
      legs_json: JSON.stringify(legs),
      time,
    });
  },

  getMissedConnection(naptanId: string, lineId: string, time: string, lat: number, lon: number) {
    return fetchJSON<MissedConnectionResult>("/recovery/missed-connection", {
      naptan_id: naptanId,
      line_id: lineId,
      time,
      lat: String(lat),
      lon: String(lon),
    });
  },

  getFairnessLayers() {
    return fetchJSON<{ layers: FairnessLayerInfo[] }>("/fairness/layers");
  },

  getFairnessLayer(layerId: string) {
    return fetchJSON<{ layer_id: string; zones: Record<string, FairnessZone> }>(
      `/fairness/layer/${layerId}`,
    );
  },

  getFairnessSummary() {
    return fetchJSON<{ summary: Record<string, FairnessSummaryDim> }>("/fairness/summary");
  },

  getFairnessZone(zoneCode: string) {
    return fetchJSON<{ zone_code: string; profile: Record<string, FairnessZone | null> }>(
      `/fairness/zone/${zoneCode}`,
    );
  },

  getCrimeContext(lat: number, lon: number) {
    return fetchJSON<{ total_incidents: number; by_category: Record<string, number>; note: string }>(
      "/exposure/crime-context",
      { lat: String(lat), lon: String(lon) },
    );
  },

  getLighting(lat: number, lon: number) {
    return fetchJSON<{ lamp_count: number; label: string; note: string }>(
      "/exposure/lighting",
      { lat: String(lat), lon: String(lon) },
    );
  },
};
