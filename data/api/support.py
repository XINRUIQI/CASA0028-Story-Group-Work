"""
Support data aggregation along a journey route.
Data sources: bus shelters, station facilities, OSM POIs, NHS, AED.

Key enhancement: time-aware filtering via opening_hours.
"""

import json
from datetime import datetime
from typing import Optional, List
from math import radians, cos, sin, asin, sqrt

from fastapi import APIRouter, HTTPException, Query

from data.core.config import PROCESSED_DIR, SUPPORT_BUFFER_METERS
from data.core.opening_hours import is_open

router = APIRouter(prefix="/support", tags=["support"])


# ── Geometry helper ──────────────────────────────────────────────

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in metres between two WGS-84 points."""
    R = 6_371_000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))


# ── File loading helpers ─────────────────────────────────────────

def _load_geojson(filename: str) -> List[dict]:
    filepath = PROCESSED_DIR / filename
    if not filepath.exists():
        return []
    with open(filepath) as f:
        data = json.load(f)
    return data.get("features", [])


def _count_within_buffer(
    features: List[dict],
    lat: float,
    lon: float,
    buffer_m: float,
) -> List[dict]:
    nearby = []
    for f in features:
        coords = f.get("geometry", {}).get("coordinates", [])
        if len(coords) >= 2:
            f_lon, f_lat = coords[0], coords[1]
            if _haversine(lat, lon, f_lat, f_lon) <= buffer_m:
                nearby.append(f)
    return nearby


def _count_open_within_buffer(
    features: List[dict],
    lat: float,
    lon: float,
    buffer_m: float,
    dt: Optional[datetime] = None,
) -> tuple[List[dict], int]:
    """Return (nearby_features, open_count) filtered by opening_hours."""
    nearby = _count_within_buffer(features, lat, lon, buffer_m)
    open_count = sum(
        1 for f in nearby
        if is_open(f.get("properties", {}).get("opening_hours"), dt)
    )
    return nearby, open_count


# ── Lazy-loaded caches ───────────────────────────────────────────

_SHELTER_CACHE: Optional[dict] = None
_STATION_FACILITIES: Optional[dict] = None
_LAYER_CACHES: dict[str, List[dict]] = {}

_LAYER_FILES = {
    "shops": "shops_late_open.geojson",
    "pharmacy": "pharmacies.geojson",
    "toilets": "toilets.geojson",
    "aed": "aed_points.geojson",
    "lamps": "street_lamps.geojson",
    "healthcare": "healthcare_points.geojson",
}


def _get_shelter_lookup() -> dict:
    global _SHELTER_CACHE
    if _SHELTER_CACHE is None:
        filepath = PROCESSED_DIR / "stop_shelter_status.json"
        if filepath.exists():
            with open(filepath) as f:
                _SHELTER_CACHE = json.load(f)
        else:
            _SHELTER_CACHE = {}
    return _SHELTER_CACHE


def _get_station_facilities() -> dict:
    global _STATION_FACILITIES
    if _STATION_FACILITIES is None:
        filepath = PROCESSED_DIR / "station_facilities.json"
        if filepath.exists():
            with open(filepath) as f:
                _STATION_FACILITIES = json.load(f)
        else:
            _STATION_FACILITIES = {}
    return _STATION_FACILITIES


def _get_layer(layer_name: str) -> List[dict]:
    if layer_name not in _LAYER_CACHES:
        filename = _LAYER_FILES.get(layer_name)
        if filename:
            _LAYER_CACHES[layer_name] = _load_geojson(filename)
        else:
            _LAYER_CACHES[layer_name] = []
    return _LAYER_CACHES[layer_name]


# ── Core support card builder ────────────────────────────────────

def get_stop_support(
    naptan_id: str,
    lat: float,
    lon: float,
    buffer_m: float = SUPPORT_BUFFER_METERS,
    time_str: Optional[str] = None,
) -> dict:
    """
    Build a support card for a single stop/station.
    When *time_str* is given, shops & pharmacies are filtered by opening_hours.
    """
    shelters = _get_shelter_lookup()
    facilities = _get_station_facilities()

    has_shelter = shelters.get(naptan_id, {}).get("has_shelter", False)
    station_info = facilities.get(naptan_id, {})

    # Build a datetime for opening_hours checking
    dt = None
    if time_str:
        try:
            h, m = map(int, time_str.split(":"))
            dt = datetime.now().replace(hour=h, minute=m, second=0)
        except (ValueError, IndexError):
            pass

    # Layers that respect opening_hours
    shops_nearby, shops_open = _count_open_within_buffer(
        _get_layer("shops"), lat, lon, buffer_m, dt
    )
    pharmacy_nearby, pharmacy_open = _count_open_within_buffer(
        _get_layer("pharmacy"), lat, lon, buffer_m, dt
    )
    healthcare_nearby, healthcare_open = _count_open_within_buffer(
        _get_layer("healthcare"), lat, lon, buffer_m, dt
    )

    # Layers without opening_hours
    toilets_nearby = _count_within_buffer(_get_layer("toilets"), lat, lon, buffer_m)
    aed_nearby = _count_within_buffer(_get_layer("aed"), lat, lon, buffer_m)
    lamps_nearby = _count_within_buffer(_get_layer("lamps"), lat, lon, buffer_m)

    has_toilet = station_info.get("toilet", False)

    total_support_open = shops_open + pharmacy_open + healthcare_open + len(toilets_nearby) + len(aed_nearby)
    total_support_all = len(shops_nearby) + len(pharmacy_nearby) + len(healthcare_nearby) + len(toilets_nearby) + len(aed_nearby)
    support_open_ratio = round(total_support_open / total_support_all, 2) if total_support_all > 0 else None

    return {
        "naptan_id": naptan_id,
        "lat": lat,
        "lon": lon,
        "time": time_str,
        "shelter": has_shelter,
        "step_free": station_info.get("step_free", "unknown"),
        "toilet_in_station": has_toilet,
        "lift_disruption": station_info.get("lift_disruption", False),
        "nearby_shops_total": len(shops_nearby),
        "nearby_shops_open": shops_open,
        "nearby_pharmacy_total": len(pharmacy_nearby),
        "nearby_pharmacy_open": pharmacy_open,
        "nearby_healthcare_total": len(healthcare_nearby),
        "nearby_healthcare_open": healthcare_open,
        "nearby_toilets": len(toilets_nearby) + (1 if has_toilet else 0),
        "nearby_aed": len(aed_nearby),
        "lamp_density": len(lamps_nearby),
        "total_support_open": total_support_open,
        "total_support_all": total_support_all,
        "support_open_ratio": support_open_ratio,
    }


# ── Endpoints ────────────────────────────────────────────────────

@router.get("/stop")
async def stop_support(
    naptan_id: str = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
    buffer_m: float = Query(SUPPORT_BUFFER_METERS),
    time: str = Query("", description="HH:MM — filters POIs by opening_hours"),
):
    return get_stop_support(naptan_id, lat, lon, buffer_m, time or None)


@router.get("/route")
async def route_support(
    legs_json: str = Query(
        ..., description="JSON list of leg objects with departure_point"
    ),
    buffer_m: float = Query(SUPPORT_BUFFER_METERS),
    time: str = Query("", description="HH:MM — filters POIs by opening_hours"),
):
    """Support cards for all stops along a journey route."""
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
            card = get_stop_support(naptan, lat, lon, buffer_m, time or None)
            card["stop_name"] = dep.get("name", "")
            card["mode"] = leg.get("mode", "")
            cards.append(card)

    return {"support_cards": cards}


@router.get("/summary")
async def route_support_summary(
    legs_json: str = Query(...),
    time: str = Query("21:00"),
    buffer_m: float = Query(SUPPORT_BUFFER_METERS),
):
    """
    Aggregate support metrics across all stops on a route.
    Produces a single summary dict for comparison cards.
    """
    try:
        legs = json.loads(legs_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid legs_json")

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
            dep.get("naptan_id", ""), lat, lon, buffer_m, time
        )
        total_open += card["total_support_open"]
        total_all += card["total_support_all"]
        total_lamps += card["lamp_density"]
        stop_count += 1

    return {
        "stop_count": stop_count,
        "mean_support_open": round(total_open / stop_count, 1) if stop_count else 0,
        "mean_support_all": round(total_all / stop_count, 1) if stop_count else 0,
        "mean_lamp_density": round(total_lamps / stop_count, 1) if stop_count else 0,
        "support_open_ratio": (
            round(total_open / total_all, 2) if total_all > 0 else None
        ),
    }
