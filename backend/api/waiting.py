"""
Waiting burden and service uncertainty computation.
Data sources: #1 TfL live arrivals + line status, #2 Timetable headway
"""

import json
from typing import Optional, Union
from pathlib import Path
from fastapi import APIRouter, Query
import httpx

from backend.core.config import TFL_BASE_URL, TFL_API_KEY

router = APIRouter(prefix="/waiting", tags=["waiting"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"


async def _tfl_get(path: str, params: Optional[dict] = None) -> Union[dict, list]:
    params = params or {}
    if TFL_API_KEY:
        params["app_key"] = TFL_API_KEY
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(f"{TFL_BASE_URL}{path}", params=params)
        if resp.status_code != 200:
            return []
        return resp.json()


def _load_headway() -> dict:
    """Load pre-computed headway data from timetable (#2)."""
    filepath = DATA_DIR / "headway_by_route_time.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


def _time_to_band(time_str: str) -> str:
    try:
        hour = int(time_str.split(":")[0])
    except (ValueError, IndexError):
        return "evening"
    if 7 <= hour < 10:
        return "am_peak"
    elif 10 <= hour < 16:
        return "inter_peak"
    elif 16 <= hour < 19:
        return "pm_peak"
    elif 19 <= hour < 22:
        return "evening"
    else:
        return "late_night"


@router.get("/burden")
async def compute_waiting_burden(
    naptan_id: str = Query(...),
    line_id: str = Query(""),
    time: str = Query("21:00"),
):
    """
    Compute waiting burden for a stop:
    - expected_wait = headway / 2 (random arrival assumption)
    - schedule_gap_ratio = evening headway / daytime headway
    - missed_penalty = full headway (next service wait)
    """
    band = _time_to_band(time)
    headway_data = _load_headway()

    route_key = line_id or naptan_id
    route_headway = headway_data.get(route_key, {})

    daytime_headway = route_headway.get("inter_peak", 5)
    target_headway = route_headway.get(band, 10)

    expected_wait = target_headway / 2
    gap_ratio = round(target_headway / daytime_headway, 2) if daytime_headway > 0 else None
    missed_penalty = target_headway

    if target_headway <= 5:
        burden_label = "low"
    elif target_headway <= 10:
        burden_label = "moderate"
    elif target_headway <= 20:
        burden_label = "heavy"
    else:
        burden_label = "very heavy"

    return {
        "naptan_id": naptan_id,
        "line_id": line_id,
        "time_band": band,
        "headway_min": target_headway,
        "daytime_headway_min": daytime_headway,
        "expected_wait_min": round(expected_wait, 1),
        "gap_ratio": gap_ratio,
        "missed_penalty_min": missed_penalty,
        "burden_label": burden_label,
    }


@router.get("/line-status")
async def get_line_status(line_id: str = Query(...)):
    """
    Get current line status from TfL (#1).
    Used for service uncertainty indication.
    """
    data = await _tfl_get(f"/Line/{line_id}/Status")
    if not data:
        return {"line_id": line_id, "statuses": []}

    statuses = []
    for line in data if isinstance(data, list) else [data]:
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
    Infer service uncertainty combining line status + headway gap.
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
