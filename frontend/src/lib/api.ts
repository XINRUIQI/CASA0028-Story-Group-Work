const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function fetchJSON<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

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
  shelter: boolean;
  step_free: string;
  toilet_in_station: boolean;
  lift_disruption: boolean;
  nearby_shops_open: number;
  nearby_pharmacy: number;
  nearby_toilets: number;
  nearby_aed: number;
  nearby_healthcare: number;
  lamp_density: number;
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

  getRouteSupport(legs: Leg[]) {
    return fetchJSON<{ support_cards: SupportCard[] }>("/support/route", {
      legs_json: JSON.stringify(legs),
    });
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

  getCrimeContext(lat: number, lon: number) {
    return fetchJSON<{ total_incidents: number; by_category: Record<string, number>; note: string }>(
      "/exposure/crime-context",
      { lat: String(lat), lon: String(lon) }
    );
  },

  getLighting(lat: number, lon: number) {
    return fetchJSON<{ lamp_count: number; label: string; note: string }>(
      "/exposure/lighting",
      { lat: String(lat), lon: String(lon) }
    );
  },
};
