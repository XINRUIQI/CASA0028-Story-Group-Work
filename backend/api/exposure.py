"""
Exposure context: crime data and lighting proxy.
Data sources: #14 OSM street_lamp, #15 Police API
"""

import httpx
from fastapi import APIRouter, Query
from backend.core.config import POLICE_API_BASE

router = APIRouter(prefix="/exposure", tags=["exposure"])


@router.get("/crime-context")
async def get_crime_context(
    lat: float = Query(...),
    lon: float = Query(...),
    date: str = Query("", description="YYYY-MM, defaults to latest available"),
):
    """
    Fetch street-level crimes near a point from Police API (#15).
    Used as contextual exposure layer only — NOT danger scoring.
    Locations are approximate (snapped to anonymisation points).
    """
    params = {"lat": lat, "lng": lon}
    if date:
        params["date"] = date

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(f"{POLICE_API_BASE}/crimes-street/all-crime", params=params)
        if resp.status_code != 200:
            return {"crimes": [], "count": 0, "note": "Data unavailable"}
        crimes = resp.json()

    category_counts = {}
    for c in crimes:
        cat = c.get("category", "other")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "lat": lat,
        "lon": lon,
        "total_incidents": len(crimes),
        "by_category": category_counts,
        "note": "Locations are approximate. Shown as contextual information only, not exact danger labels.",
    }


@router.get("/lighting")
async def get_lighting_proxy(
    lat: float = Query(...),
    lon: float = Query(...),
    buffer_m: float = Query(300),
):
    """
    Street lamp density within buffer (#14 OSM).
    This is a proxy for lighting infrastructure presence, not measured brightness.
    Data comes from pre-processed OSM street_lamp export.
    """
    from backend.api.support import _count_within_buffer, _get_layer

    lamps = _count_within_buffer(_get_layer("lamps"), lat, lon, buffer_m)
    count = len(lamps)

    if count >= 15:
        label = "well-lit infrastructure"
    elif count >= 5:
        label = "moderate lighting infrastructure"
    elif count >= 1:
        label = "sparse lighting infrastructure"
    else:
        label = "no recorded lighting infrastructure"

    return {
        "lat": lat,
        "lon": lon,
        "lamp_count": count,
        "buffer_m": buffer_m,
        "label": label,
        "note": "Proxy for lighting infrastructure presence from OSM, not measured brightness.",
    }
