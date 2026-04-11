"""
Activity and crowding data aggregation.
Data sources: #8 Network Demand, #9 near-real-time crowding,
#10 BUSTO, #11 NUMBAT, #12 Annual Station Counts
"""

import json
from typing import Optional, Union
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
import httpx

from backend.core.config import TFL_BASE_URL, TFL_API_KEY

router = APIRouter(prefix="/activity", tags=["activity"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"


async def _tfl_get(path: str, params: Optional[dict] = None) -> dict:
    params = params or {}
    if TFL_API_KEY:
        params["app_key"] = TFL_API_KEY
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(f"{TFL_BASE_URL}{path}", params=params)
        if resp.status_code != 200:
            return {}
        return resp.json()


def _load_json(filename: str) -> Union[dict, list]:
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


def _get_busto_data() -> dict:
    """BUSTO boarding/alighting by stop and time band."""
    return _load_json("busto_by_stop.json")


def _get_numbat_data() -> dict:
    """NUMBAT rail demand by station and time band."""
    return _load_json("numbat_by_station.json")


def _get_annual_counts() -> dict:
    """Annual station entry/exit counts."""
    return _load_json("annual_station_counts.json")


def _time_to_band(time_str: str) -> str:
    """Map HH:MM to a time band label."""
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


@router.get("/crowding")
async def get_crowding(naptan_id: str = Query(...)):
    """
    Fetch near-real-time crowding from TfL (#9).
    Returns percentage busyness relative to historical maximum.
    """
    data = await _tfl_get(f"/crowding/{naptan_id}/Live")
    return {
        "naptan_id": naptan_id,
        "crowding": data,
    }


@router.get("/stop-activity")
async def get_stop_activity(
    naptan_id: str = Query(...),
    time: str = Query("21:00"),
):
    """
    Get activity context for a stop: BUSTO boarding/alighting + demand baseline.
    Returns day vs target-time-band comparison.
    """
    band = _time_to_band(time)
    busto = _get_busto_data()
    stop_data = busto.get(naptan_id, {})

    day_boarding = stop_data.get("inter_peak", {}).get("boarding", 0)
    target_boarding = stop_data.get(band, {}).get("boarding", 0)

    return {
        "naptan_id": naptan_id,
        "time_band": band,
        "daytime_boarding": day_boarding,
        "target_boarding": target_boarding,
        "activity_ratio": round(target_boarding / day_boarding, 2) if day_boarding > 0 else None,
        "label": _activity_label(target_boarding, day_boarding),
    }


def _activity_label(target: float, daytime: float) -> str:
    if daytime == 0:
        return "no data"
    ratio = target / daytime
    if ratio > 0.8:
        return "busy"
    elif ratio > 0.4:
        return "moderate"
    elif ratio > 0.15:
        return "quiet"
    else:
        return "very quiet"


@router.get("/station-activity")
async def get_station_activity(
    naptan_id: str = Query(...),
    time: str = Query("21:00"),
):
    """
    Get station-level activity: NUMBAT rail demand + annual counts baseline.
    """
    band = _time_to_band(time)
    numbat = _get_numbat_data()
    annual = _get_annual_counts()

    station = numbat.get(naptan_id, {})
    annual_count = annual.get(naptan_id, {})

    day_demand = station.get("inter_peak", {}).get("demand", 0)
    target_demand = station.get(band, {}).get("demand", 0)

    return {
        "naptan_id": naptan_id,
        "time_band": band,
        "daytime_demand": day_demand,
        "target_demand": target_demand,
        "annual_entries": annual_count.get("annual_entries", 0),
        "annual_exits": annual_count.get("annual_exits", 0),
        "activity_ratio": round(target_demand / day_demand, 2) if day_demand > 0 else None,
        "label": _activity_label(target_demand, day_demand),
    }
