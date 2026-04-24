"""
TfL Journey Planner integration.
Data sources: TfL Unified API — journey planning, arrivals, status.
"""

import asyncio

from fastapi import APIRouter, Query

from data.core.tfl_client import tfl_get

router = APIRouter(prefix="/journey", tags=["journey"])

INTERCHANGE_WALK_METERS_PER_MIN = 80


def _to_tfl_time(t: str) -> str:
    if t == "24:00":
        return "0000"
    return t.replace(":", "")


def _parse_int(value, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _time_to_minutes(time_value: str) -> int | None:
    try:
        hours, minutes = time_value.split(":", 1)
        total = int(hours) * 60 + int(minutes)
    except (AttributeError, TypeError, ValueError):
        return None

    if total == 24 * 60:
        return 0
    return total


def _is_peak_payg_time(time_value: str) -> bool:
    minutes = _time_to_minutes(time_value)
    if minutes is None:
        return False
    morning_peak = 6 * 60 + 30 <= minutes < 9 * 60 + 30
    evening_peak = 16 * 60 <= minutes < 19 * 60
    return morning_peak or evening_peak


def _parse_ticket_cost_pence(value) -> int | None:
    try:
        return int(round(float(value) * 100))
    except (TypeError, ValueError):
        return None


async def _lookup_single_fare(origin: str, destination: str, time: str) -> int | None:
    data = await tfl_get(
        f"/StopPoint/{origin}/FareTo/{destination}",
        {"time": _to_tfl_time(time)},
        raise_on_error=False,
    )
    if not isinstance(data, list):
        return None

    rows = []
    for section in data:
        if isinstance(section, dict):
            rows.extend(section.get("rows", []))

    if not rows:
        return None

    target_ticket_time = "Peak" if _is_peak_payg_time(time) else "Off Peak"
    payg_tickets: list[dict] = []
    fallback_tickets: list[dict] = []

    for row in rows:
        if not isinstance(row, dict):
            continue
        for ticket in row.get("ticketsAvailable", []):
            if not isinstance(ticket, dict):
                continue

            passenger_type = str(ticket.get("passengerType") or "")
            if passenger_type and passenger_type.lower() != "adult":
                continue

            ticket_type = str(ticket.get("ticketType", {}).get("type") or "")
            if ticket_type == "Pay as you go":
                payg_tickets.append(ticket)
            fallback_tickets.append(ticket)

    preferred_tickets = payg_tickets or fallback_tickets
    if not preferred_tickets:
        return None

    timed_match = next(
        (
            ticket for ticket in preferred_tickets
            if str(ticket.get("ticketTime", {}).get("type") or "") == target_ticket_time
        ),
        None,
    )
    chosen_ticket = timed_match or preferred_tickets[0]
    return _parse_ticket_cost_pence(chosen_ticket.get("cost"))


async def _parse_journey_with_fare(
    raw: dict,
    *,
    origin: str,
    destination: str,
    time: str,
) -> dict:
    journey = _parse_journey(raw)
    if journey.get("fare") is not None:
        return journey

    if not origin or not destination:
        return journey

    journey["fare"] = await _lookup_single_fare(origin, destination, time)
    return journey


def _parse_leg(leg: dict) -> dict:
    mode = leg["mode"]["id"]
    is_walk = mode == "walking"
    interchange_duration_min = _parse_int(leg.get("interChangeDuration"), 0)

    parsed = {
        "mode": leg["mode"]["name"],
        "mode_id": mode,
        "is_walking": is_walk,
        "duration_min": leg.get("duration", 0),
        "interchange_duration_min": interchange_duration_min,
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
        parsed["distance_m"] = float(leg.get("distance") or 0)
    elif interchange_duration_min > 0:
        parsed["interchange_distance_m"] = (
            interchange_duration_min * INTERCHANGE_WALK_METERS_PER_MIN
        )

    return parsed


def _parse_journey(raw: dict) -> dict:
    """Extract structured journey data from a single TfL journey object."""
    legs = [_parse_leg(leg) for leg in raw.get("legs", [])]

    explicit_walk_min = sum(l["duration_min"] for l in legs if l.get("is_walking"))
    interchange_walk_min = sum(
        l.get("interchange_duration_min", 0) for l in legs if not l.get("is_walking")
    )
    total_walk_min = explicit_walk_min + interchange_walk_min
    total_walk_m = sum(l.get("distance_m", 0) for l in legs) + sum(
        l.get("interchange_distance_m", 0) for l in legs
    )
    transfers = max(0, sum(1 for l in legs if not l["is_walking"]) - 1)

    fare = None
    if raw.get("fare"):
        fare = raw["fare"].get("totalCost")

    return {
        "duration_min": raw.get("duration", 0),
        "fare": fare,
        "walk_min": total_walk_min,
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
    time: str = Query("19:00", description="Departure time HH:MM"),
    date: str = Query("", description="Date YYYYMMDD, defaults to today"),
):
    """Call TfL Journey Planner for a single departure time."""
    params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(time)}
    if date:
        params["date"] = date

    data = await tfl_get(
        f"/Journey/JourneyResults/{origin}/to/{destination}", params
    )
    journeys = [
        await _parse_journey_with_fare(
            journey,
            origin=origin,
            destination=destination,
            time=time,
        )
        for journey in data.get("journeys", [])
    ]
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
        "14:00,19:00,00:00",
        description="Comma-separated departure times",
    ),
    date: str = Query(""),
):
    """Compare the same OD pair across multiple departure times (Page 3 core)."""
    time_list = [t.strip() for t in times.split(",")]
    results = {}

    for idx, t in enumerate(time_list):
        if idx > 0:
            await asyncio.sleep(0.6)
        try:
            params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(t)}
            if date:
                params["date"] = date
            data = await tfl_get(
                f"/Journey/JourneyResults/{origin}/to/{destination}",
                params,
                raise_on_error=False,
            )
            journeys_raw = data.get("journeys", []) if isinstance(data, dict) else []
            journeys = [
                await _parse_journey_with_fare(
                    journey,
                    origin=origin,
                    destination=destination,
                    time=t,
                )
                for journey in journeys_raw
            ]
            results[t] = journeys[0] if journeys else None
        except Exception:
            results[t] = None

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
