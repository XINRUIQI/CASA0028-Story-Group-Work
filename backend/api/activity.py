"""
Activity and crowding data aggregation.
Data sources: TfL crowding, BUSTO, NUMBAT, annual station counts,
              GLA Night Time Economy (MSOA-level).
"""

import json
from typing import Union

from fastapi import APIRouter, Query

from backend.core.config import PROCESSED_DIR, time_to_band
from backend.core.tfl_client import tfl_get

router = APIRouter(prefix="/activity", tags=["activity"])


def _load_json(filename: str) -> Union[dict, list]:
    filepath = PROCESSED_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


def _activity_label(target: float, daytime: float) -> str:
    if daytime == 0:
        return "no data"
    ratio = target / daytime
    if ratio > 0.8:
        return "busy"
    if ratio > 0.4:
        return "moderate"
    if ratio > 0.15:
        return "quiet"
    return "very quiet"


@router.get("/crowding")
async def get_crowding(naptan_id: str = Query(...)):
    """Near-real-time crowding from TfL (percentage vs historical max)."""
    data = await tfl_get(f"/crowding/{naptan_id}/Live", raise_on_error=False)
    return {"naptan_id": naptan_id, "crowding": data}


@router.get("/stop-activity")
async def get_stop_activity(
    naptan_id: str = Query(...),
    time: str = Query("21:00"),
):
    """BUSTO boarding/alighting — day vs target band comparison."""
    band = time_to_band(time)
    busto = _load_json("busto_by_stop.json")
    stop_data = busto.get(naptan_id, {})

    day_boarding = stop_data.get("inter_peak", {}).get("boarding", 0)
    target_boarding = stop_data.get(band, {}).get("boarding", 0)

    return {
        "naptan_id": naptan_id,
        "time_band": band,
        "daytime_boarding": day_boarding,
        "target_boarding": target_boarding,
        "activity_ratio": (
            round(target_boarding / day_boarding, 2) if day_boarding > 0 else None
        ),
        "label": _activity_label(target_boarding, day_boarding),
    }


@router.get("/station-activity")
async def get_station_activity(
    naptan_id: str = Query(...),
    time: str = Query("21:00"),
):
    """NUMBAT rail demand + annual counts baseline."""
    band = time_to_band(time)
    numbat = _load_json("numbat_by_station.json")
    annual = _load_json("annual_station_counts.json")

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
        "activity_ratio": (
            round(target_demand / day_demand, 2) if day_demand > 0 else None
        ),
        "label": _activity_label(target_demand, day_demand),
    }


@router.get("/nighttime-economy")
async def get_nighttime_economy(
    msoa_code: str = Query("", description="MSOA code (optional, returns all if empty)"),
):
    """
    GLA Night Time Economy proxy by MSOA.
    Fields: nighttime_workplaces, nighttime_employees, nte_intensity_percentile.
    """
    nte = _load_json("nighttime_economy_msoa.json")
    if not nte:
        return {"note": "Night-time economy data not yet processed.", "data": {}}
    if msoa_code:
        return {"msoa_code": msoa_code, "data": nte.get(msoa_code, {})}
    return {"count": len(nte), "data": nte}
