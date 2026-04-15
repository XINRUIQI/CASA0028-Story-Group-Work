"""
Six Comparison Cards aggregation (Page 3 core).

Combines journey planner, waiting, support, activity, exposure and
recovery data into a unified set of six trade-off cards per departure
time.  No single score — each dimension is presented independently.

Cards:
  1. Functional cost     – duration, walk, transfers, fare
  2. Waiting burden      – total wait, max single wait, wait share
  3. Service uncertainty – headway gap, disruptions, fallback count
  4. Support access      – open POIs, facility count, support ratio
  5. Activity context    – footfall proxy, open-late density, NTE
  6. Lighting proxy      – lit-road share, lamp density
"""

import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from data.core.config import (
    PROCESSED_DIR,
    SUPPORT_BUFFER_METERS,
    time_to_band,
)
from data.core.tfl_client import tfl_get
from data.api.journey import _parse_journey, _to_tfl_time, _ROUTE_PARAMS_BASE
from data.api.support import get_stop_support
from data.api.exposure import get_lighting_proxy, get_lit_road_share

router = APIRouter(prefix="/compare", tags=["compare"])


def _load_headway() -> dict:
    filepath = PROCESSED_DIR / "headway_by_route_time.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


# ── Card builders ────────────────────────────────────────────────

def _functional_cost(journey: dict) -> dict:
    legs = journey.get("legs", [])
    walk_min = sum(l["duration_min"] for l in legs if l.get("is_walking"))
    ride_min = sum(l["duration_min"] for l in legs if not l.get("is_walking"))
    return {
        "card": "functional_cost",
        "total_duration_min": journey.get("duration_min", 0),
        "walk_min": walk_min,
        "ride_min": ride_min,
        "walk_distance_m": journey.get("walk_distance_m", 0),
        "transfers": journey.get("transfers", 0),
        "fare": journey.get("fare"),
    }


def _waiting_burden(journey: dict, headway_data: dict, time_str: str) -> dict:
    band = time_to_band(time_str)
    legs = journey.get("legs", [])

    waits = []
    for leg in legs:
        if leg.get("is_walking"):
            continue
        line_id = leg.get("line_id", "")
        hw = headway_data.get(line_id, {}).get(band, 10)
        waits.append(hw / 2)  # random-arrival expected wait

    total_wait = sum(waits)
    max_wait = max(waits) if waits else 0
    duration = journey.get("duration_min", 1)
    wait_share = round(total_wait / duration, 2) if duration > 0 else 0

    return {
        "card": "waiting_burden",
        "total_expected_wait_min": round(total_wait, 1),
        "max_single_wait_min": round(max_wait, 1),
        "wait_share_of_journey": wait_share,
        "wait_segments": len(waits),
    }


async def _service_uncertainty(
    journey: dict, headway_data: dict, time_str: str
) -> dict:
    band = time_to_band(time_str)
    legs = journey.get("legs", [])

    disruption_count = 0
    gap_ratios = []
    fallback_total = 0
    lines_checked = set()

    for leg in legs:
        if leg.get("is_walking"):
            continue
        line_id = leg.get("line_id", "")
        if not line_id or line_id in lines_checked:
            continue
        lines_checked.add(line_id)

        # Headway gap ratio
        hw = headway_data.get(line_id, {})
        day_hw = hw.get("inter_peak", 5)
        night_hw = hw.get(band, 10)
        if day_hw > 0:
            gap_ratios.append(round(night_hw / day_hw, 2))

        # Line status
        status_data = await tfl_get(
            f"/Line/{line_id}/Status", raise_on_error=False
        )
        if isinstance(status_data, list):
            for line in status_data:
                for s in line.get("lineStatuses", []):
                    sev = s.get("statusSeverity")
                    if sev is not None and sev < 10:
                        disruption_count += 1

        # Fallback lines at departure stop
        dep = leg.get("departure_point", {})
        naptan = dep.get("naptan_id", "")
        if naptan:
            stop_info = await tfl_get(
                f"/StopPoint/{naptan}", raise_on_error=False
            )
            if isinstance(stop_info, dict):
                fallback_total += len(stop_info.get("lines", []))

    mean_gap = (
        round(sum(gap_ratios) / len(gap_ratios), 2) if gap_ratios else None
    )

    return {
        "card": "service_uncertainty",
        "disruption_count": disruption_count,
        "mean_headway_gap_ratio": mean_gap,
        "fallback_lines_total": fallback_total,
        "lines_checked": len(lines_checked),
        "note": "Inferred from timetables and status, not true delay probability.",
    }


def _support_access(journey: dict, time_str: str) -> dict:
    legs = journey.get("legs", [])
    total_open = 0
    total_all = 0
    total_lamps = 0
    stop_count = 0

    for leg in legs:
        dep = leg.get("departure_point", {})
        lat = dep.get("lat")
        lon = dep.get("lon")
        if lat is None or lon is None:
            continue
        card = get_stop_support(
            dep.get("naptan_id", ""),
            lat, lon,
            SUPPORT_BUFFER_METERS,
            time_str,
        )
        total_open += card["total_support_open"]
        total_all += card["total_support_all"]
        total_lamps += card["lamp_density"]
        stop_count += 1

    return {
        "card": "support_access",
        "stops_assessed": stop_count,
        "total_support_open": total_open,
        "total_support_all": total_all,
        "mean_support_open": round(total_open / stop_count, 1) if stop_count else 0,
        "support_open_ratio": (
            round(total_open / total_all, 2) if total_all > 0 else None
        ),
        "mean_lamp_density": round(total_lamps / stop_count, 1) if stop_count else 0,
    }


def _activity_context(journey: dict, time_str: str) -> dict:
    """
    Activity context along the route.
    Uses pre-loaded NTE data if available; falls back to support
    POI density as a "someone is around" proxy.
    """
    nte_path = PROCESSED_DIR / "nighttime_economy_msoa.json"
    nte_data: dict = {}
    if nte_path.exists():
        with open(nte_path) as f:
            nte_data = json.load(f)

    legs = journey.get("legs", [])
    support_card = _support_access(journey, time_str)

    return {
        "card": "activity_context",
        "open_support_density": support_card["mean_support_open"],
        "nte_data_available": bool(nte_data),
        "note": "Proxy for 'someone is around', not real-time crowd count.",
    }


def _lighting_proxy(journey: dict) -> dict:
    legs = journey.get("legs", [])
    from data.api.support import _count_within_buffer, _get_layer

    total_lamps = 0
    walk_segments = 0

    for leg in legs:
        if not leg.get("is_walking"):
            continue
        walk_segments += 1
        dep = leg.get("departure_point", {})
        lat = dep.get("lat")
        lon = dep.get("lon")
        if lat is None or lon is None:
            continue
        lamps = _count_within_buffer(
            _get_layer("lamps"), lat, lon, SUPPORT_BUFFER_METERS
        )
        total_lamps += len(lamps)

    mean_lamps = round(total_lamps / walk_segments, 1) if walk_segments else 0

    if mean_lamps >= 15:
        label = "well-lit infrastructure"
    elif mean_lamps >= 5:
        label = "moderate lighting"
    elif mean_lamps >= 1:
        label = "sparse lighting"
    else:
        label = "no recorded lighting"

    return {
        "card": "lighting_proxy",
        "walk_segments_assessed": walk_segments,
        "total_lamps_on_walks": total_lamps,
        "mean_lamps_per_walk": mean_lamps,
        "label": label,
        "note": "Infrastructure presence from OSM, not measured brightness.",
    }


# ── Main endpoint ────────────────────────────────────────────────

@router.get("/cards")
async def get_comparison_cards(
    origin: str = Query(...),
    destination: str = Query(...),
    times: str = Query(
        "09:00,21:00,23:30",
        description="Comma-separated departure times",
    ),
    date: str = Query(""),
):
    """
    Core endpoint: return six comparison cards for each departure time.
    This powers the Page 3 side-by-side comparison.
    """
    time_list = [t.strip() for t in times.split(",")]
    headway_data = _load_headway()
    results = {}

    for t in time_list:
        params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(t)}
        if date:
            params["date"] = date
        data = await tfl_get(
            f"/Journey/JourneyResults/{origin}/to/{destination}", params
        )
        journeys_raw = data.get("journeys", [])
        if not journeys_raw:
            results[t] = None
            continue

        journey = _parse_journey(journeys_raw[0])

        cards = {
            "functional_cost": _functional_cost(journey),
            "waiting_burden": _waiting_burden(journey, headway_data, t),
            "service_uncertainty": await _service_uncertainty(
                journey, headway_data, t
            ),
            "support_access": _support_access(journey, t),
            "activity_context": _activity_context(journey, t),
            "lighting_proxy": _lighting_proxy(journey),
        }

        results[t] = {
            "journey": journey,
            "cards": cards,
        }

    return {
        "origin": origin,
        "destination": destination,
        "options": results,
        "note": "Each card is an independent dimension. No single score.",
    }


@router.get("/hourly")
async def get_hourly_curves(
    origin: str = Query(...),
    destination: str = Query(...),
    start_hour: int = Query(18, description="Start hour (inclusive)"),
    end_hour: int = Query(1, description="End hour (inclusive, wraps midnight)"),
    date: str = Query(""),
):
    """
    Compute key metrics at each hour for time-of-day curves (Page 6).
    Returns waiting_burden, support_availability, recovery_penalty per hour.
    """
    headway_data = _load_headway()

    hours = []
    h = start_hour
    while True:
        hours.append(h)
        if h == end_hour:
            break
        h = (h + 1) % 24

    curves: dict = {}
    for h in hours:
        t = f"{h:02d}:00"
        params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(t)}
        if date:
            params["date"] = date

        data = await tfl_get(
            f"/Journey/JourneyResults/{origin}/to/{destination}",
            params,
            raise_on_error=False,
        )
        journeys_raw = data.get("journeys", []) if isinstance(data, dict) else []
        if not journeys_raw:
            curves[t] = None
            continue

        journey = _parse_journey(journeys_raw[0])
        wb = _waiting_burden(journey, headway_data, t)
        sa = _support_access(journey, t)

        # Recovery: max missed-connection penalty
        band = time_to_band(t)
        max_penalty = 0
        for leg in journey.get("legs", []):
            if leg.get("is_walking"):
                continue
            lid = leg.get("line_id", "")
            hw = headway_data.get(lid, {}).get(band, 15)
            if hw > max_penalty:
                max_penalty = hw

        curves[t] = {
            "duration_min": journey["duration_min"],
            "waiting_burden": wb["total_expected_wait_min"],
            "wait_share": wb["wait_share_of_journey"],
            "support_open": sa["total_support_open"],
            "support_ratio": sa["support_open_ratio"],
            "max_recovery_penalty_min": max_penalty,
        }

    return {
        "origin": origin,
        "destination": destination,
        "curves": curves,
    }
