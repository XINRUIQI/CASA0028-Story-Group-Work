"""
Waiting burden and service uncertainty computation.
Data sources: TfL live arrivals + line status, timetable headway.
"""

import json
from typing import Optional

from fastapi import APIRouter, Query

from backend.core.config import PROCESSED_DIR, time_to_band
from backend.core.tfl_client import tfl_get

router = APIRouter(prefix="/waiting", tags=["waiting"])


def _load_headway() -> dict:
    filepath = PROCESSED_DIR / "headway_by_route_time.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


@router.get("/burden")
async def compute_waiting_burden(
    naptan_id: str = Query(""),
    line_id: str = Query(""),
    time: str = Query("21:00"),
):
    """
    Waiting burden for a stop/line:
      expected_wait ≈ headway / 2   (random-arrival assumption)
      gap_ratio     = target headway / daytime headway
      missed_penalty = full headway  (next service wait)
    """
    band = time_to_band(time)
    headway_data = _load_headway()

    route_key = line_id or naptan_id
    route_headway = headway_data.get(route_key, {})

    daytime_hw = route_headway.get("inter_peak", 5)
    target_hw = route_headway.get(band, 10)

    expected_wait = target_hw / 2
    gap_ratio = round(target_hw / daytime_hw, 2) if daytime_hw > 0 else None

    if target_hw <= 5:
        label = "low"
    elif target_hw <= 10:
        label = "moderate"
    elif target_hw <= 20:
        label = "heavy"
    else:
        label = "very heavy"

    return {
        "naptan_id": naptan_id,
        "line_id": line_id,
        "time_band": band,
        "headway_min": target_hw,
        "daytime_headway_min": daytime_hw,
        "expected_wait_min": round(expected_wait, 1),
        "gap_ratio": gap_ratio,
        "missed_penalty_min": target_hw,
        "burden_label": label,
    }


@router.get("/line-status")
async def get_line_status(line_id: str = Query(...)):
    """Current line status from TfL (service uncertainty)."""
    data = await tfl_get(f"/Line/{line_id}/Status", raise_on_error=False)
    if not data:
        return {"line_id": line_id, "statuses": []}

    statuses = []
    items = data if isinstance(data, list) else [data]
    for line in items:
        for s in line.get("lineStatuses", []):
            statuses.append({
                "severity": s.get("statusSeverity"),
                "severity_description": s.get("statusSeverityDescription", ""),
                "reason": s.get("reason", ""),
            })

    return {"line_id": line_id, "statuses": statuses}


@router.get("/uncertainty")
async def compute_service_uncertainty(
    line_id: str = Query(...),
    time: str = Query("21:00"),
):
    """
    Infer service uncertainty from line status + headway gap.
    NOT a true delay probability — an inferred contextual indicator.
    """
    status_data = await get_line_status(line_id)
    burden_data = await compute_waiting_burden("", line_id, time)

    has_disruption = any(
        s["severity"] is not None and s["severity"] < 10
        for s in status_data.get("statuses", [])
    )
    gap_ratio = burden_data.get("gap_ratio")
    headway_stretched = gap_ratio is not None and gap_ratio > 1.5

    if has_disruption:
        level = "elevated"
        explanation = "Active service disruption reported."
    elif headway_stretched:
        level = "moderate"
        explanation = f"Service frequency drops to {gap_ratio}x of daytime levels."
    else:
        level = "low"
        explanation = "Service broadly running to schedule."

    return {
        "line_id": line_id,
        "time": time,
        "uncertainty_level": level,
        "has_disruption": has_disruption,
        "headway_gap_ratio": gap_ratio,
        "explanation": explanation,
        "note": "Inferred from timetables and status feeds, not a true delay probability.",
    }


@router.get("/arrivals")
async def get_stop_arrivals(
    naptan_id: str = Query(..., description="NaPTAN ID of the stop"),
):
    """Live arrival predictions at a stop — feeds the journey timeline."""
    data = await tfl_get(
        f"/StopPoint/{naptan_id}/Arrivals", raise_on_error=False
    )
    if not data or not isinstance(data, list):
        return {"naptan_id": naptan_id, "arrivals": []}

    arrivals = sorted(data, key=lambda a: a.get("timeToStation", 9999))
    return {
        "naptan_id": naptan_id,
        "arrivals": [
            {
                "line_id": a.get("lineId", ""),
                "line_name": a.get("lineName", ""),
                "destination": a.get("destinationName", ""),
                "expected_arrival": a.get("expectedArrival", ""),
                "time_to_station_s": a.get("timeToStation"),
                "platform": a.get("platformName", ""),
            }
            for a in arrivals[:15]
        ],
    }
