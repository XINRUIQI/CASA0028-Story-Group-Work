"""
Support data aggregation along a journey route.
Data sources: #4 Bus Shelters, #5 Bus Stops/Stations, #6 Station topology,
#7 Bus station toilets, #14 OSM, #16 NHS, #17 AED
"""

import json
from typing import Optional, List, Dict
from pathlib import Path
from math import radians, cos, sin, asin, sqrt
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/support", tags=["support"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two lat/lon points."""
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))


def _load_geojson(filename: str) -> List[dict]:
    """Load a processed GeoJSON file and return its features."""
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return []
    with open(filepath) as f:
        data = json.load(f)
    return data.get("features", [])


def _count_within_buffer(features: List[dict], lat: float, lon: float, buffer_m: float) -> List[dict]:
    """Return features within buffer distance of a point."""
    nearby = []
    for f in features:
        coords = f.get("geometry", {}).get("coordinates", [])
        if len(coords) >= 2:
            f_lon, f_lat = coords[0], coords[1]
            if _haversine(lat, lon, f_lat, f_lon) <= buffer_m:
                nearby.append(f)
    return nearby


_SHELTER_CACHE: Optional[dict] = None
_SHOPS_CACHE: Optional[list] = None
_PHARMACY_CACHE: Optional[list] = None
_TOILETS_CACHE: Optional[list] = None
_AED_CACHE: Optional[list] = None
_LAMPS_CACHE: Optional[list] = None
_HEALTHCARE_CACHE: Optional[list] = None
_STATION_FACILITIES: Optional[dict] = None


def _get_shelter_lookup() -> dict:
    global _SHELTER_CACHE
    if _SHELTER_CACHE is None:
        filepath = DATA_DIR / "stop_shelter_status.json"
        if filepath.exists():
            with open(filepath) as f:
                _SHELTER_CACHE = json.load(f)
        else:
            _SHELTER_CACHE = {}
    return _SHELTER_CACHE


def _get_station_facilities() -> dict:
    global _STATION_FACILITIES
    if _STATION_FACILITIES is None:
        filepath = DATA_DIR / "station_facilities.json"
        if filepath.exists():
            with open(filepath) as f:
                _STATION_FACILITIES = json.load(f)
        else:
            _STATION_FACILITIES = {}
    return _STATION_FACILITIES


def _get_layer(layer_name: str) -> List[dict]:
    """Lazy-load a GeoJSON support layer."""
    mapping = {
        "shops": ("shops_late_open.geojson", "_SHOPS_CACHE"),
        "pharmacy": ("pharmacies.geojson", "_PHARMACY_CACHE"),
        "toilets": ("toilets.geojson", "_TOILETS_CACHE"),
        "aed": ("aed_points.geojson", "_AED_CACHE"),
        "lamps": ("street_lamps.geojson", "_LAMPS_CACHE"),
        "healthcare": ("healthcare_points.geojson", "_HEALTHCARE_CACHE"),
    }
    filename, cache_var = mapping.get(layer_name, (None, None))
    if filename is None:
        return []

    cache = globals().get(cache_var)
    if cache is not None:
        return cache

    features = _load_geojson(filename)
    globals()[cache_var] = features
    return features


def get_stop_support(naptan_id: str, lat: float, lon: float, buffer_m: float = 300) -> dict:
    """
    Build a support card for a single stop/station point.
    Used by Page 3 Unpack to annotate each journey segment.
    """
    shelters = _get_shelter_lookup()
    facilities = _get_station_facilities()

    has_shelter = shelters.get(naptan_id, {}).get("has_shelter", False)

    station_info = facilities.get(naptan_id, {})
    has_step_free = station_info.get("step_free", "unknown")
    has_toilet = station_info.get("toilet", False)
    has_lift_disruption = station_info.get("lift_disruption", False)

    shops_nearby = _count_within_buffer(_get_layer("shops"), lat, lon, buffer_m)
    pharmacy_nearby = _count_within_buffer(_get_layer("pharmacy"), lat, lon, buffer_m)
    toilets_nearby = _count_within_buffer(_get_layer("toilets"), lat, lon, buffer_m)
    aed_nearby = _count_within_buffer(_get_layer("aed"), lat, lon, buffer_m)
    healthcare_nearby = _count_within_buffer(_get_layer("healthcare"), lat, lon, buffer_m)
    lamps_nearby = _count_within_buffer(_get_layer("lamps"), lat, lon, buffer_m)

    return {
        "naptan_id": naptan_id,
        "lat": lat,
        "lon": lon,
        "shelter": has_shelter,
        "step_free": has_step_free,
        "toilet_in_station": has_toilet,
        "lift_disruption": has_lift_disruption,
        "nearby_shops_open": len(shops_nearby),
        "nearby_pharmacy": len(pharmacy_nearby),
        "nearby_toilets": len(toilets_nearby) + (1 if has_toilet else 0),
        "nearby_aed": len(aed_nearby),
        "nearby_healthcare": len(healthcare_nearby),
        "lamp_density": len(lamps_nearby),
    }


@router.get("/stop")
async def stop_support(
    naptan_id: str = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
    buffer_m: float = Query(300),
):
    """Get support card for a single stop."""
    return get_stop_support(naptan_id, lat, lon, buffer_m)


@router.get("/route")
async def route_support(
    legs_json: str = Query(..., description="JSON-encoded list of leg objects with departure_point info"),
    buffer_m: float = Query(300),
):
    """
    Get support cards for all stops along a journey route.
    Expects legs from the journey planner response.
    """
    try:
        legs = json.loads(legs_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid legs_json")

    cards = []
    for leg in legs:
        dep = leg.get("departure_point", {})
        naptan = dep.get("naptan_id", "")
        lat = dep.get("lat")
        lon = dep.get("lon")
        if lat is not None and lon is not None:
            card = get_stop_support(naptan, lat, lon, buffer_m)
            card["stop_name"] = dep.get("name", "")
            card["mode"] = leg.get("mode", "")
            cards.append(card)

    return {"support_cards": cards}
