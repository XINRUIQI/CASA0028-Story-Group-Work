"""
TfL Journey Planner integration.
Data sources: #1 TfL Unified API, #2 Timetable headway
"""

from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from backend.core.config import TFL_BASE_URL, TFL_API_KEY

router = APIRouter(prefix="/journey", tags=["journey"])


def _to_tfl_time(t: str) -> str:
    """Convert 'HH:MM' to 'HHmm' as required by TfL API."""
    return t.replace(":", "")


async def _tfl_get(path: str, params: Optional[dict] = None) -> dict:
    params = params or {}
    if TFL_API_KEY:
        params["app_key"] = TFL_API_KEY
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{TFL_BASE_URL}{path}", params=params)

        if resp.status_code == 300:
            body = resp.json()
            for key in ("fromLocationDisambiguation", "toLocationDisambiguation"):
                dis = body.get(key, {})
                options = dis.get("disambiguationOptions", [])
                if options and dis.get("matchStatus") == "list":
                    uri = options[0].get("uri", "")
                    if uri:
                        retry = await client.get(f"{TFL_BASE_URL}{uri}")
                        if retry.status_code == 200:
                            return retry.json()

            raise HTTPException(status_code=300, detail="TfL could not resolve origin/destination uniquely.")

        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


def _parse_journey(raw: dict) -> dict:
    """Extract structured journey data from a single TfL journey object."""
    legs = []
    total_walk_m = 0
    transfers = 0

    for leg in raw.get("legs", []):
        mode = leg["mode"]["id"]
        is_walk = mode == "walking"
        duration = leg.get("duration", 0)

        parsed_leg = {
            "mode": leg["mode"]["name"],
            "mode_id": mode,
            "is_walking": is_walk,
            "duration_min": duration,
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
            "line_id": leg.get("routeOptions", [{}])[0].get("lineIdentifier", {}).get("id", ""),
            "path": leg.get("path", {}).get("lineString", ""),
        }

        if is_walk:
            distance = leg.get("distance", 0)
            total_walk_m += distance
            parsed_leg["distance_m"] = distance
        else:
            transfers += 1

        legs.append(parsed_leg)

    # First non-walk leg doesn't count as a transfer
    if transfers > 0:
        transfers -= 1

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


@router.get("/plan")
async def plan_journey(
    origin: str = Query(..., description="Origin location (lat,lon or NaPTAN ID)"),
    destination: str = Query(..., description="Destination location (lat,lon or NaPTAN ID)"),
    time: str = Query("18:00", description="Departure time HH:MM"),
    date: str = Query("", description="Date YYYYMMDD, defaults to today"),
):
    """
    Call TfL Journey Planner for a single departure time.
    Returns parsed journey options.
    """
    params = {
        "time": _to_tfl_time(time),
        "timeIs": "Departing",
        "journeyPreference": "LeastTime",
        "mode": "tube,bus,dlr,overground,elizabeth-line,walking",
    }
    if date:
        params["date"] = date

    data = await _tfl_get(f"/Journey/JourneyResults/{origin}/to/{destination}", params)

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
    times: str = Query("18:00,21:00,22:30", description="Comma-separated departure times"),
    date: str = Query(""),
):
    """
    Compare the same OD pair across multiple departure times.
    Core endpoint for Page 2.
    """
    time_list = [t.strip() for t in times.split(",")]
    results = {}

    for t in time_list:
        params = {
            "time": _to_tfl_time(t),
            "timeIs": "Departing",
            "journeyPreference": "LeastTime",
            "mode": "tube,bus,dlr,overground,elizabeth-line,walking",
        }
        if date:
            params["date"] = date

        data = await _tfl_get(f"/Journey/JourneyResults/{origin}/to/{destination}", params)
        journeys = [_parse_journey(j) for j in data.get("journeys", [])]
        results[t] = journeys[0] if journeys else None

    return {
        "origin": origin,
        "destination": destination,
        "options": results,
    }


@router.get("/stoppoint/search")
async def search_stoppoint(query: str = Query(..., min_length=2)):
    """Autocomplete for stop point search (Landing page input)."""
    data = await _tfl_get("/StopPoint/Search", {"query": query, "modes": "tube,bus,dlr,overground,elizabeth-line"})
    matches = []
    for m in data.get("matches", [])[:10]:
        matches.append({
            "name": m.get("name", ""),
            "naptan_id": m.get("id", ""),
            "lat": m.get("lat"),
            "lon": m.get("lon"),
            "modes": m.get("modes", []),
        })
    return {"matches": matches}
