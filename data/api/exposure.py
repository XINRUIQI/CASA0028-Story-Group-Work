"""
Exposure context: crime data and lighting proxy.
Data sources: OSM street_lamp / lit ways, Police API.
"""

import json

import httpx
from fastapi import APIRouter, Query

from data.core.config import POLICE_API_BASE, PROCESSED_DIR

router = APIRouter(prefix="/exposure", tags=["exposure"])


@router.get("/crime-context")
async def get_crime_context(
    lat: float = Query(...),
    lon: float = Query(...),
    date: str = Query("", description="YYYY-MM, defaults to latest available"),
):
    """
    Street-level crimes near a point from Police API.
    Locations are approximate — contextual exposure only, NOT danger scoring.
    """
    params: dict = {"lat": lat, "lng": lon}
    if date:
        params["date"] = date

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{POLICE_API_BASE}/crimes-street/all-crime", params=params
        )
        if resp.status_code != 200:
            return {"crimes": [], "count": 0, "note": "Data unavailable"}
        crimes = resp.json()

    category_counts: dict[str, int] = {}
    for c in crimes:
        cat = c.get("category", "other")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "lat": lat,
        "lon": lon,
        "total_incidents": len(crimes),
        "by_category": category_counts,
        "note": "Locations are approximate. Contextual information only.",
    }


@router.get("/lighting")
async def get_lighting_proxy(
    lat: float = Query(...),
    lon: float = Query(...),
    buffer_m: float = Query(300),
):
    """
    Street lamp density within buffer (OSM).
    Proxy for lighting infrastructure presence, not measured brightness.
    """
    from data.api.support import _count_within_buffer, _get_layer

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
        "note": "Proxy from OSM, not measured brightness.",
    }


@router.get("/lit-roads")
async def get_lit_road_share(
    lat: float = Query(...),
    lon: float = Query(...),
    buffer_m: float = Query(300),
):
    """
    Share of road segments tagged lit=yes within buffer.
    Loaded from pre-processed OSM ways with lit=* tag.
    """
    filepath = PROCESSED_DIR / "lit_ways_segments.json"
    if not filepath.exists():
        return {
            "lat": lat,
            "lon": lon,
            "lit_share": None,
            "note": "lit_ways_segments.json not yet generated. Run data/scripts/06_osm_lit_ways.py.",
        }

    with open(filepath) as f:
        segments = json.load(f)

    from data.api.support import _haversine

    total = 0
    lit_count = 0
    for seg in segments:
        slat, slon = seg.get("lat", 0), seg.get("lon", 0)
        if _haversine(lat, lon, slat, slon) <= buffer_m:
            total += 1
            if seg.get("lit") == "yes":
                lit_count += 1

    lit_share = round(lit_count / total, 2) if total > 0 else None

    return {
        "lat": lat,
        "lon": lon,
        "total_segments": total,
        "lit_segments": lit_count,
        "lit_share": lit_share,
        "note": "Proportion of OSM road segments tagged lit=yes. Not measured brightness.",
    }
