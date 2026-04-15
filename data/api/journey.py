"""
TfL Journey Planner integration.
Data sources: TfL Unified API — journey planning, arrivals, status.
"""

from fastapi import APIRouter, Query

from data.core.tfl_client import tfl_get

router = APIRouter(prefix="/journey", tags=["journey"])


def _to_tfl_time(t: str) -> str:
    return t.replace(":", "")


def _parse_leg(leg: dict) -> dict:
    mode = leg["mode"]["id"]
    is_walk = mode == "walking"

    parsed = {
        "mode": leg["mode"]["name"],
        "mode_id": mode,
        "is_walking": is_walk,
        "duration_min": leg.get("duration", 0),
        "summary": leg.get("instruction", {}).get("summary", ""),
        "departure_point": {
            "name": leg["departurePoint"].get("commonName", ""),
            "naptan_id": leg["departurePoint"].get("naptanId", ""),
            "lat": leg["departurePoint"].get("lat"),
            "lon": leg["departurePoint"].get("lon"),
        },
        "arrival_point": {
            "name": leg["arrivalPoint"].get("commonName", ""),
            "naptan_id": leg["arrivalPoint"].get("naptanId", ""),
            "lat": leg["arrivalPoint"].get("lat"),
            "lon": leg["arrivalPoint"].get("lon"),
        },
        "line_id": (
            leg.get("routeOptions", [{}])[0]
            .get("lineIdentifier", {})
            .get("id", "")
        ),
        "path": leg.get("path", {}).get("lineString", ""),
    }

    if is_walk:
        parsed["distance_m"] = leg.get("distance", 0)

    return parsed


def _parse_journey(raw: dict) -> dict:
    """Extract structured journey data from a single TfL journey object."""
    legs = [_parse_leg(leg) for leg in raw.get("legs", [])]

    total_walk_m = sum(l.get("distance_m", 0) for l in legs)
    transfers = max(0, sum(1 for l in legs if not l["is_walking"]) - 1)

    fare = None
    if raw.get("fare"):
        fare = raw["fare"].get("totalCost")

    return {
        "duration_min": raw.get("duration", 0),
        "fare": fare,
        "walk_distance_m": total_walk_m,
        "transfers": transfers,
        "legs": legs,
        "arrival_time": raw.get("arrivalDateTime", ""),
        "departure_time": raw.get("startDateTime", ""),
    }


_ROUTE_PARAMS_BASE = {
    "timeIs": "Departing",
    "journeyPreference": "LeastTime",
    "mode": "tube,bus,dlr,overground,elizabeth-line,walking",
}


@router.get("/plan")
async def plan_journey(
    origin: str = Query(..., description="Origin (lat,lon or NaPTAN ID)"),
    destination: str = Query(..., description="Destination (lat,lon or NaPTAN ID)"),
    time: str = Query("18:00", description="Departure time HH:MM"),
    date: str = Query("", description="Date YYYYMMDD, defaults to today"),
):
    """Call TfL Journey Planner for a single departure time."""
    params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(time)}
    if date:
        params["date"] = date

    data = await tfl_get(
        f"/Journey/JourneyResults/{origin}/to/{destination}", params
    )
    journeys = [_parse_journey(j) for j in data.get("journeys", [])]
    return {
        "origin": origin,
        "destination": destination,
        "departure_time": time,
        "journeys": journeys,
    }


@router.get("/compare")
async def compare_journey(
    origin: str = Query(...),
    destination: str = Query(...),
    times: str = Query(
        "09:00,18:00,21:00,23:30",
        description="Comma-separated departure times",
    ),
    date: str = Query(""),
):
    """Compare the same OD pair across multiple departure times (Page 3 core)."""
    time_list = [t.strip() for t in times.split(",")]
    results = {}

    for t in time_list:
        params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(t)}
        if date:
            params["date"] = date
        data = await tfl_get(
            f"/Journey/JourneyResults/{origin}/to/{destination}", params
        )
        journeys = [_parse_journey(j) for j in data.get("journeys", [])]
        results[t] = journeys[0] if journeys else None

    return {"origin": origin, "destination": destination, "options": results}


@router.get("/stoppoint/search")
async def search_stoppoint(query: str = Query(..., min_length=2)):
    """Autocomplete for stop point search."""
    data = await tfl_get(
        "/StopPoint/Search",
        {"query": query, "modes": "tube,bus,dlr,overground,elizabeth-line"},
    )
    return {
        "matches": [
            {
                "name": m.get("name", ""),
                "naptan_id": m.get("id", ""),
                "lat": m.get("lat"),
                "lon": m.get("lon"),
                "modes": m.get("modes", []),
            }
            for m in data.get("matches", [])[:10]
        ]
    }
