"""
Missed-connection simulation ("What if you miss this connection?").

For each transfer node on a journey, this module asks:
  - How long until the *next* feasible service?
  - How many fallback routes remain at that stop?
  - How does nearby support change?

This directly addresses the project's core insight:
  "夜晚不只是更慢，而是更难恢复。"
"""

import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.core.config import PROCESSED_DIR, time_to_band
from backend.core.tfl_client import tfl_get
from backend.api.support import get_stop_support

router = APIRouter(prefix="/recovery", tags=["recovery"])


def _load_headway() -> dict:
    filepath = PROCESSED_DIR / "headway_by_route_time.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


async def _count_fallback_lines(naptan_id: str) -> int:
    """How many distinct lines serve this stop (proxy for alternatives)."""
    if not naptan_id:
        return 0
    data = await tfl_get(
        f"/StopPoint/{naptan_id}",
        raise_on_error=False,
    )
    if not data or not isinstance(data, dict):
        return 0
    lines = data.get("lines", [])
    return len(lines)


@router.get("/missed-connection")
async def simulate_missed_connection(
    naptan_id: str = Query(..., description="NaPTAN ID of the transfer stop"),
    line_id: str = Query(..., description="Line the passenger just missed"),
    time: str = Query("21:00", description="Current departure time HH:MM"),
    lat: float = Query(0),
    lon: float = Query(0),
):
    """
    Simulate missing a connection at a transfer point.

    Returns:
      extra_wait_min      – full headway until next service
      fallback_lines      – how many other lines serve this stop
      daytime_extra_wait  – same penalty during daytime (for comparison)
      recovery_difficulty – qualitative label
      support_nearby      – support card for the wait location
    """
    band = time_to_band(time)
    headway_data = _load_headway()

    route_hw = headway_data.get(line_id, {})
    target_hw = route_hw.get(band, 15)
    daytime_hw = route_hw.get("inter_peak", 5)

    fallback_count = await _count_fallback_lines(naptan_id)

    # Recovery difficulty heuristic
    if target_hw <= 5 and fallback_count >= 3:
        difficulty = "easy"
        explanation = "Frequent service and multiple alternatives."
    elif target_hw <= 10 and fallback_count >= 2:
        difficulty = "manageable"
        explanation = "Moderate wait; some alternatives available."
    elif target_hw <= 15:
        difficulty = "difficult"
        explanation = "Long wait; limited alternatives at this hour."
    else:
        difficulty = "very difficult"
        explanation = "Very long wait; few or no alternative services."

    result: dict = {
        "naptan_id": naptan_id,
        "line_id": line_id,
        "time": time,
        "time_band": band,
        "extra_wait_min": target_hw,
        "daytime_extra_wait_min": daytime_hw,
        "wait_penalty_ratio": round(target_hw / daytime_hw, 2) if daytime_hw > 0 else None,
        "fallback_lines": fallback_count,
        "recovery_difficulty": difficulty,
        "explanation": explanation,
        "note": "Simulated from timetable headway, not real-time prediction.",
    }

    if lat and lon:
        result["support_nearby"] = get_stop_support(
            naptan_id, lat, lon, buffer_m=300, time_str=time
        )

    return result


@router.get("/journey-recovery")
async def journey_recovery_profile(
    legs_json: str = Query(
        ..., description="JSON list of legs from journey planner"
    ),
    time: str = Query("21:00"),
):
    """
    Compute recovery profile for an entire journey.
    Identifies the worst-case missed connection and overall resilience.
    """
    try:
        legs = json.loads(legs_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid legs_json")

    transfer_penalties = []

    for i, leg in enumerate(legs):
        if leg.get("is_walking"):
            continue
        line_id = leg.get("line_id", "")
        dep = leg.get("departure_point", {})
        naptan = dep.get("naptan_id", "")
        lat = dep.get("lat", 0)
        lon = dep.get("lon", 0)

        if not line_id:
            continue

        sim = await simulate_missed_connection(
            naptan_id=naptan,
            line_id=line_id,
            time=time,
            lat=lat,
            lon=lon,
        )
        transfer_penalties.append({
            "leg_index": i,
            "stop_name": dep.get("name", ""),
            "line_id": line_id,
            "extra_wait_min": sim["extra_wait_min"],
            "fallback_lines": sim["fallback_lines"],
            "recovery_difficulty": sim["recovery_difficulty"],
        })

    if not transfer_penalties:
        return {
            "time": time,
            "worst_case": None,
            "overall_resilience": "no transfers",
            "transfers": [],
        }

    worst = max(transfer_penalties, key=lambda t: t["extra_wait_min"])
    avg_wait = sum(t["extra_wait_min"] for t in transfer_penalties) / len(transfer_penalties)

    if avg_wait <= 5:
        resilience = "high"
    elif avg_wait <= 12:
        resilience = "moderate"
    elif avg_wait <= 20:
        resilience = "low"
    else:
        resilience = "very low"

    return {
        "time": time,
        "worst_case": worst,
        "mean_penalty_min": round(avg_wait, 1),
        "overall_resilience": resilience,
        "transfers": transfer_penalties,
    }
