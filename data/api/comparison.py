"""
Comparison card aggregation for the compare page.

Combines journey planner, waiting, support, activity, safety and
lighting data into a unified set of trade-off cards per departure time.
No single score — each dimension is presented independently.

Cards:
    1. Functional cost     – duration, walk, transfers, fare
    2. Waiting burden      – total wait, max single wait, wait share
    3. Service uncertainty – headway gap, disruptions, fallback count
    4. Support access      – open POIs, facility count, support ratio
    5. Activity context    – footfall proxy, open-late density, NTE
    6. Safety exposure     – LSOA crime/visibility-weighted corridor proxy
    7. Lighting proxy      – lit-road share, lamp density
"""
from __future__ import annotations

import asyncio
import json
from typing import Optional

import geopandas as gpd
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from shapely.geometry import LineString, Point

from data.core.config import (
    PROCESSED_DIR,
    SUPPORT_BUFFER_METERS,
    time_to_band,
)
from data.core.tfl_client import tfl_get
from data.api.journey import _parse_journey_with_fare, _to_tfl_time, _ROUTE_PARAMS_BASE
from data.api.support import get_stop_support
from data.api.exposure import get_lighting_proxy, get_lit_road_share

router = APIRouter(prefix="/compare", tags=["compare"])

_MSOA_CONTEXT_CACHE: Optional[gpd.GeoDataFrame] = None
_LSOA_SAFETY_CACHE: Optional[gpd.GeoDataFrame] = None


def _load_headway() -> dict:
    filepath = PROCESSED_DIR / "headway_by_route_time.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


def _zscore(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce").astype(float)
    std = numeric.std(skipna=True)
    if pd.isna(std) or std == 0:
        return pd.Series(0.0, index=series.index, dtype=float)
    mean = numeric.mean(skipna=True)
    return (numeric - mean) / std


def _rank_pct(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce").astype(float)
    if numeric.notna().sum() == 0:
        return pd.Series(np.nan, index=series.index, dtype=float)
    return numeric.rank(pct=True, method="average")


def _read_vector_layer(path) -> gpd.GeoDataFrame:
    try:
        return gpd.read_file(path)
    except Exception:
        return gpd.read_file(path, engine="fiona")


def _load_msoa_context() -> gpd.GeoDataFrame:
    global _MSOA_CONTEXT_CACHE
    if _MSOA_CONTEXT_CACHE is not None:
        return _MSOA_CONTEXT_CACHE

    boundaries_path = PROCESSED_DIR / "msoa_boundaries.geojson"
    support_path = PROCESSED_DIR / "msoa_night_support_activity.csv"
    if not boundaries_path.exists() or not support_path.exists():
        _MSOA_CONTEXT_CACHE = gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")
        return _MSOA_CONTEXT_CACHE

    boundaries = _read_vector_layer(boundaries_path)
    support = pd.read_csv(support_path)
    merged = boundaries.merge(support, on=["msoa_code", "msoa_name"], how="left")
    projected = merged.to_crs("EPSG:27700")

    area_km2 = projected.geometry.area / 1_000_000
    projected["area_km2"] = area_km2.replace(0, np.nan)
    projected["nte_density"] = projected["nte_businesses_2017"] / projected["area_km2"]
    projected["pub_density"] = projected["pub_workplaces_2017"] / projected["area_km2"]
    projected["food_density"] = projected["licensed_food_2017"] / projected["area_km2"]
    projected["entertainment_density"] = projected["clubs_2017"] / projected["area_km2"]
    projected["nightlife_density"] = projected["cim_nightlife_poi_count"] / projected["area_km2"]
    projected["cultural_density"] = projected["cim_cultural_poi_count"] / projected["area_km2"]
    projected["venue_density"] = (
        projected[["cim_nightlife_poi_count", "cim_cultural_poi_count", "cim_lgbt_venue_count"]]
        .fillna(0)
        .sum(axis=1)
        / projected["area_km2"]
    )
    projected["support_index_runtime"] = (
        _zscore(projected["nte_density"]).fillna(0)
        + _zscore(projected["pub_density"]).fillna(0)
        + _zscore(projected["food_density"]).fillna(0)
        + _zscore(projected["entertainment_density"]).fillna(0)
    ) / 4
    projected["activity_index_runtime"] = (
        _zscore(projected["nte_density"]).fillna(0)
        + _zscore(projected["nightlife_density"]).fillna(0)
        + _zscore(projected["cultural_density"]).fillna(0)
        + _zscore(projected["pub_density"]).fillna(0)
    ) / 4

    _MSOA_CONTEXT_CACHE = projected
    return _MSOA_CONTEXT_CACHE


def _load_lsoa_safety_context() -> gpd.GeoDataFrame:
    global _LSOA_SAFETY_CACHE
    if _LSOA_SAFETY_CACHE is not None:
        return _LSOA_SAFETY_CACHE

    boundaries_path = PROCESSED_DIR / "lsoa_boundaries.geojson"
    safety_path = PROCESSED_DIR / "lsoa_night_safety_context.csv"
    if not boundaries_path.exists() or not safety_path.exists():
        _LSOA_SAFETY_CACHE = gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")
        return _LSOA_SAFETY_CACHE

    boundaries = _read_vector_layer(boundaries_path)
    safety = pd.read_csv(safety_path)
    merged = boundaries.merge(safety, on=["lsoa_code", "lsoa_name"], how="left")
    projected = merged.to_crs("EPSG:27700")

    safety_index = pd.to_numeric(projected["safety_index"], errors="coerce").clip(0, 1)
    lit_share = pd.to_numeric(projected["fully_lit_share_proxy"], errors="coerce").clip(0, 1)
    visibility_index = (
        pd.to_numeric(projected["visibility_index"], errors="coerce").clip(0, 1)
    ).fillna(lit_share)
    crime_percentile = _rank_pct(projected["crime_severity_proxy"]).fillna(0.5)

    safety_index_filled = safety_index.fillna(1 - crime_percentile)
    visibility_index_filled = visibility_index.fillna(0.5)
    safety_exposure = (
        (1 - safety_index_filled) * 0.75
        + (1 - visibility_index_filled) * 0.25
    ).clip(0, 1)

    projected["crime_percentile"] = crime_percentile
    projected["safety_index_runtime"] = safety_index_filled.clip(0, 1)
    projected["visibility_index_runtime"] = visibility_index_filled.clip(0, 1)
    projected["safety_exposure_runtime"] = safety_exposure

    _LSOA_SAFETY_CACHE = projected
    return _LSOA_SAFETY_CACHE


def _decode_polyline(encoded: str) -> list[tuple[float, float]]:
    coords: list[tuple[float, float]] = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        lat += ~(result >> 1) if result & 1 else (result >> 1)

        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        lng += ~(result >> 1) if result & 1 else (result >> 1)

        coords.append((lng / 1e5, lat / 1e5))
    return coords


def _parse_linestring_path(path: str) -> list[tuple[float, float]]:
    if not isinstance(path, str) or not path.strip().startswith("[["):
        return []
    try:
        parsed = json.loads(path)
    except json.JSONDecodeError:
        return []

    coords: list[tuple[float, float]] = []
    if not isinstance(parsed, list):
        return coords
    for pair in parsed:
        if not isinstance(pair, (list, tuple)) or len(pair) < 2:
            continue
        lat, lon = pair[0], pair[1]
        try:
            coords.append((float(lon), float(lat)))
        except (TypeError, ValueError):
            continue
    return coords


def _safe_point(payload: dict) -> Point | None:
    lat = payload.get("lat")
    lon = payload.get("lon")
    if lat is None or lon is None:
        return None
    return Point(float(lon), float(lat))


def _leg_linestring(leg: dict) -> LineString | None:
    path = leg.get("path", "")
    coords: list[tuple[float, float]] = []
    if isinstance(path, str) and path:
        coords = _parse_linestring_path(path)
        if not coords:
            try:
                coords = _decode_polyline(path)
            except Exception:
                coords = []

    if len(coords) >= 2:
        return LineString(coords)

    dep = _safe_point(leg.get("departure_point", {}))
    arr = _safe_point(leg.get("arrival_point", {}))
    if dep is not None and arr is not None and dep.coords[0] != arr.coords[0]:
        return LineString([dep.coords[0], arr.coords[0]])
    return None


def _journey_geometries(journey: dict) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    line_records = []
    stop_records = []
    legs = journey.get("legs", [])

    for index, leg in enumerate(legs):
        geom = _leg_linestring(leg)
        if geom is not None:
            line_records.append({
                "leg_index": index,
                "is_walking": leg.get("is_walking", False),
                "geometry": geom,
            })

        dep = _safe_point(leg.get("departure_point", {}))
        arr = _safe_point(leg.get("arrival_point", {}))
        if index == 0 and dep is not None:
            stop_records.append({"stop_role": "origin", "geometry": dep})
        if index < len(legs) - 1 and arr is not None:
            stop_records.append({"stop_role": "transfer", "geometry": arr})
        if index == len(legs) - 1 and arr is not None:
            stop_records.append({"stop_role": "destination", "geometry": arr})

    lines = gpd.GeoDataFrame(line_records, geometry="geometry", crs="EPSG:4326")
    stops = gpd.GeoDataFrame(stop_records, geometry="geometry", crs="EPSG:4326")
    return lines, stops


def _weighted_overlap_mean(layer: gpd.GeoDataFrame, target_geom, value_column: str) -> float | None:
    overlaps = layer.loc[layer.intersects(target_geom), [value_column, "geometry"]].copy()
    if overlaps.empty:
        return None
    areas = overlaps.geometry.intersection(target_geom).area
    total_area = areas.sum()
    if total_area <= 0:
        return None
    weights = areas / total_area
    values = pd.to_numeric(overlaps[value_column], errors="coerce")
    valid = values.notna() & weights.notna()
    if not valid.any():
        return None
    return float((weights[valid] * values[valid]).sum())


def _route_support_activity_context(journey: dict) -> dict:
    msoa_layer = _load_msoa_context()
    if msoa_layer.empty:
        return {}

    lines, stops = _journey_geometries(journey)
    if lines.empty:
        return {}

    projected_lines = lines.to_crs("EPSG:27700")
    corridor = projected_lines.geometry.union_all().buffer(SUPPORT_BUFFER_METERS)
    projected_stops = stops.to_crs("EPSG:27700") if not stops.empty else gpd.GeoDataFrame(geometry=[], crs="EPSG:27700")
    stop_union = (
        projected_stops.geometry.buffer(SUPPORT_BUFFER_METERS).union_all()
        if not projected_stops.empty
        else None
    )

    corridor_support = _weighted_overlap_mean(msoa_layer, corridor, "support_index_runtime")
    corridor_activity = _weighted_overlap_mean(msoa_layer, corridor, "activity_index_runtime")
    corridor_venue_density = _weighted_overlap_mean(msoa_layer, corridor, "venue_density")
    corridor_nightlife_density = _weighted_overlap_mean(msoa_layer, corridor, "nightlife_density")

    stop_support = _weighted_overlap_mean(msoa_layer, stop_union, "support_index_runtime") if stop_union is not None else None
    stop_activity = _weighted_overlap_mean(msoa_layer, stop_union, "activity_index_runtime") if stop_union is not None else None

    support_parts = [v for v in [corridor_support, stop_support] if v is not None]
    activity_parts = [v for v in [corridor_activity, stop_activity] if v is not None]
    overlapping_count = int(msoa_layer.intersects(corridor).sum())

    return {
        "corridor_support_index": round(corridor_support, 3) if corridor_support is not None else None,
        "stop_buffer_support_index": round(stop_support, 3) if stop_support is not None else None,
        "route_support_index": round(float(np.mean(support_parts)), 3) if support_parts else None,
        "corridor_activity_index": round(corridor_activity, 3) if corridor_activity is not None else None,
        "stop_buffer_activity_index": round(stop_activity, 3) if stop_activity is not None else None,
        "route_activity_index": round(float(np.mean(activity_parts)), 3) if activity_parts else None,
        "route_venue_density": round(corridor_venue_density, 2) if corridor_venue_density is not None else None,
        "route_nightlife_density": round(corridor_nightlife_density, 2) if corridor_nightlife_density is not None else None,
        "msoa_match_count": overlapping_count,
    }


def _route_safety_context(journey: dict) -> dict:
    lsoa_layer = _load_lsoa_safety_context()
    if lsoa_layer.empty:
        return {}

    lines, stops = _journey_geometries(journey)
    if lines.empty:
        return {}

    projected_lines = lines.to_crs("EPSG:27700")
    corridor = projected_lines.geometry.union_all().buffer(SUPPORT_BUFFER_METERS)
    projected_stops = (
        stops.to_crs("EPSG:27700")
        if not stops.empty
        else gpd.GeoDataFrame(geometry=[], crs="EPSG:27700")
    )
    stop_union = (
        projected_stops.geometry.buffer(SUPPORT_BUFFER_METERS).union_all()
        if not projected_stops.empty
        else None
    )

    corridor_exposure = _weighted_overlap_mean(
        lsoa_layer, corridor, "safety_exposure_runtime"
    )
    stop_exposure = (
        _weighted_overlap_mean(lsoa_layer, stop_union, "safety_exposure_runtime")
        if stop_union is not None
        else None
    )
    corridor_safety_index = _weighted_overlap_mean(
        lsoa_layer, corridor, "safety_index_runtime"
    )
    corridor_visibility = _weighted_overlap_mean(
        lsoa_layer, corridor, "visibility_index_runtime"
    )
    corridor_crime_pct = _weighted_overlap_mean(
        lsoa_layer, corridor, "crime_percentile"
    )

    exposure_parts = [v for v in [corridor_exposure, stop_exposure] if v is not None]
    overlapping_count = int(lsoa_layer.intersects(corridor).sum())

    return {
        "corridor_safety_exposure": round(corridor_exposure, 3) if corridor_exposure is not None else None,
        "stop_buffer_safety_exposure": round(stop_exposure, 3) if stop_exposure is not None else None,
        "route_safety_exposure": round(float(np.mean(exposure_parts)), 3) if exposure_parts else None,
        "route_safety_index": round(corridor_safety_index, 3) if corridor_safety_index is not None else None,
        "route_visibility_index": round(corridor_visibility, 3) if corridor_visibility is not None else None,
        "route_crime_percentile": round(corridor_crime_pct, 3) if corridor_crime_pct is not None else None,
        "lsoa_match_count": overlapping_count,
    }


# ── Card builders ────────────────────────────────────────────────

def _functional_cost(journey: dict) -> dict:
    legs = journey.get("legs", [])
    walk_min = journey.get("walk_min")
    if walk_min is None:
        walk_min = sum(l["duration_min"] for l in legs if l.get("is_walking"))
    ride_min = sum(l["duration_min"] for l in legs if not l.get("is_walking"))
    return {
        "card": "functional_cost",
        "total_duration_min": journey.get("duration_min", 0),
        "walk_min": walk_min,
        "ride_min": ride_min,
        "walk_distance_m": journey.get("walk_distance_m", 0),
        "transfers": journey.get("transfers", 0),
        "fare": journey.get("fare"),
    }


def _waiting_burden(journey: dict, headway_data: dict, time_str: str) -> dict:
    band = time_to_band(time_str)
    legs = journey.get("legs", [])

    leg_waits: list[dict] = []
    for idx, leg in enumerate(legs):
        if leg.get("is_walking"):
            continue
        line_id = leg.get("line_id", "") or ""
        line_hw = headway_data.get(line_id, {})
        hw = line_hw.get(band, 10)
        day_hw = line_hw.get("inter_peak", 5)
        expected_wait = round(hw / 2, 1)
        gap_ratio = round(hw / day_hw, 2) if day_hw > 0 else None
        leg_waits.append(
            {
                "leg_index": idx,
                "line_id": line_id,
                "time_band": band,
                "headway_min": hw,
                "daytime_headway_min": day_hw,
                "expected_wait_min": expected_wait,
                "gap_ratio": gap_ratio,
            }
        )

    waits = [lw["expected_wait_min"] for lw in leg_waits]
    total_wait = sum(waits)
    max_wait = max(waits) if waits else 0
    duration = journey.get("duration_min", 1)
    wait_share = round(total_wait / duration, 2) if duration > 0 else 0

    return {
        "card": "waiting_burden",
        "total_expected_wait_min": round(total_wait, 1),
        "max_single_wait_min": round(max_wait, 1),
        "wait_share_of_journey": wait_share,
        "wait_segments": len(waits),
        "leg_waits": leg_waits,
    }


async def _service_uncertainty(
    journey: dict, headway_data: dict, time_str: str
) -> dict:
    band = time_to_band(time_str)
    legs = journey.get("legs", [])

    disruption_count = 0
    disrupted_lines = set()
    gap_ratios = []
    fallback_total = 0
    alternative_route_counts = []
    lines_checked = set()

    for leg in legs:
        if leg.get("is_walking"):
            continue
        line_id = leg.get("line_id", "")
        if not line_id or line_id in lines_checked:
            continue
        lines_checked.add(line_id)

        # Headway gap ratio
        hw = headway_data.get(line_id, {})
        day_hw = hw.get("inter_peak", 5)
        night_hw = hw.get(band, 10)
        if day_hw > 0:
            gap_ratios.append(round(night_hw / day_hw, 2))

        # Line status
        status_data = await tfl_get(
            f"/Line/{line_id}/Status", raise_on_error=False
        )
        if isinstance(status_data, list):
            for line in status_data:
                for s in line.get("lineStatuses", []):
                    sev = s.get("statusSeverity")
                    if sev is not None and sev < 10:
                        disruption_count += 1
                        disrupted_lines.add(line_id)

        # Fallback lines at departure stop
        dep = leg.get("departure_point", {})
        naptan = dep.get("naptan_id", "")
        if naptan:
            stop_info = await tfl_get(
                f"/StopPoint/{naptan}", raise_on_error=False
            )
            if isinstance(stop_info, dict):
                lines_here = stop_info.get("lines", [])
                line_ids_here = {
                    str(line.get("id", "")).lower()
                    for line in lines_here
                    if isinstance(line, dict) and line.get("id")
                }
                fallback_total += len(line_ids_here)
                alternative_route_counts.append(
                    max(len(line_ids_here - {line_id.lower()}), 0)
                )

    mean_gap = (
        round(sum(gap_ratios) / len(gap_ratios), 2) if gap_ratios else None
    )
    mean_alternative_routes = (
        round(sum(alternative_route_counts) / len(alternative_route_counts), 2)
        if alternative_route_counts
        else None
    )

    headway_component = 0
    if mean_gap is not None:
        headway_component = round(
            min(max((mean_gap - 1) / 2, 0), 1) * 35
        )

    alternatives_component = 25
    if mean_alternative_routes is not None:
        alternatives_component = round(
            min(max((4 - mean_alternative_routes) / 4, 0), 1) * 25
        )

    transfer_component = round(
        min(journey.get("transfers", 0), 3) / 3 * 20
    )

    status_component = round(
        (len(disrupted_lines) / len(lines_checked)) * 20
    ) if lines_checked else 0

    uncertainty_score_pct = min(
        100,
        headway_component
        + alternatives_component
        + transfer_component
        + status_component,
    )

    if uncertainty_score_pct >= 75:
        uncertainty_label = "very high"
    elif uncertainty_score_pct >= 50:
        uncertainty_label = "high"
    elif uncertainty_score_pct >= 25:
        uncertainty_label = "moderate"
    else:
        uncertainty_label = "low"

    return {
        "card": "service_uncertainty",
        "uncertainty_score_pct": uncertainty_score_pct,
        "uncertainty_label": uncertainty_label,
        "headway_component": headway_component,
        "alternatives_component": alternatives_component,
        "transfer_component": transfer_component,
        "status_component": status_component,
        "disruption_count": disruption_count,
        "disrupted_lines": sorted(disrupted_lines),
        "mean_headway_gap_ratio": mean_gap,
        "mean_alternative_routes": mean_alternative_routes,
        "transfer_count": journey.get("transfers", 0),
        "fallback_lines_total": fallback_total,
        "lines_checked": len(lines_checked),
        "note": "Composite proxy from headway, alternatives, transfers, and live status. Not a true delay probability.",
    }


def _hourly_uncertainty_score(journey: dict, headway_data: dict, time_str: str) -> dict:
    band = time_to_band(time_str)
    line_ids = {
        leg.get("line_id", "")
        for leg in journey.get("legs", [])
        if not leg.get("is_walking") and leg.get("line_id")
    }

    gap_ratios = []
    for line_id in line_ids:
        hw = headway_data.get(line_id, {})
        day_hw = hw.get("inter_peak", 5)
        time_hw = hw.get(band, 10)
        if day_hw > 0:
            gap_ratios.append(round(time_hw / day_hw, 2))

    mean_gap = round(sum(gap_ratios) / len(gap_ratios), 2) if gap_ratios else None
    headway_component = 0
    if mean_gap is not None:
        headway_component = round(min(max((mean_gap - 1) / 2, 0), 1) * 70)

    transfer_component = round(
        min(journey.get("transfers", 0), 3) / 3 * 30
    )

    return {
        "uncertainty_score_pct": min(100, headway_component + transfer_component),
        "mean_headway_gap_ratio": mean_gap,
        "headway_component": headway_component,
        "transfer_component": transfer_component,
    }


def _support_access(journey: dict, time_str: str, route_context: Optional[dict] = None) -> dict:
    legs = journey.get("legs", [])
    total_open = 0
    total_all = 0
    total_lamps = 0
    stop_count = 0
    route_context = route_context or {}

    for leg in legs:
        dep = leg.get("departure_point", {})
        lat = dep.get("lat")
        lon = dep.get("lon")
        if lat is None or lon is None:
            continue
        card = get_stop_support(
            dep.get("naptan_id", ""),
            lat, lon,
            SUPPORT_BUFFER_METERS,
            time_str,
        )
        total_open += card["total_support_open"]
        total_all += card["total_support_all"]
        total_lamps += card["lamp_density"]
        stop_count += 1

    return {
        "card": "support_access",
        "stops_assessed": stop_count,
        "total_support_open": total_open,
        "total_support_all": total_all,
        "mean_support_open": round(total_open / stop_count, 1) if stop_count else 0,
        "support_open_ratio": (
            round(total_open / total_all, 2) if total_all > 0 else None
        ),
        "mean_lamp_density": round(total_lamps / stop_count, 1) if stop_count else 0,
        "route_support_index": route_context.get("route_support_index"),
        "stop_buffer_support_index": route_context.get("stop_buffer_support_index"),
        "corridor_support_index": route_context.get("corridor_support_index"),
        "route_venue_density": route_context.get("route_venue_density"),
        "msoa_match_count": route_context.get("msoa_match_count"),
    }


def _activity_context(
    journey: dict,
    time_str: str,
    support_card: Optional[dict] = None,
    route_context: Optional[dict] = None,
) -> dict:
    """
    Activity context along the route.
    Uses pre-loaded NTE data if available; falls back to support
    POI density as a "someone is around" proxy.
    """
    nte_path = PROCESSED_DIR / "nighttime_economy_msoa.json"
    nte_data: dict = {}
    if nte_path.exists():
        with open(nte_path) as f:
            nte_data = json.load(f)

    route_context = route_context or {}
    support_card = support_card or _support_access(journey, time_str, route_context)

    return {
        "card": "activity_context",
        "open_support_density": support_card["mean_support_open"],
        "nte_data_available": bool(nte_data),
        "route_activity_index": route_context.get("route_activity_index"),
        "corridor_activity_index": route_context.get("corridor_activity_index"),
        "stop_buffer_activity_index": route_context.get("stop_buffer_activity_index"),
        "route_venue_density": route_context.get("route_venue_density"),
        "route_nightlife_density": route_context.get("route_nightlife_density"),
        "msoa_match_count": route_context.get("msoa_match_count"),
        "note": "Proxy for 'someone is around', not real-time crowd count.",
    }


def _safety_exposure(journey: dict, route_context: Optional[dict] = None) -> dict:
    route_context = route_context or {}
    exposure_value = route_context.get("route_safety_exposure")
    exposure_pct = (
        round(float(exposure_value) * 100)
        if exposure_value is not None
        else None
    )

    if exposure_pct is None:
        exposure_label = None
    elif exposure_pct >= 75:
        exposure_label = "very high"
    elif exposure_pct >= 50:
        exposure_label = "high"
    elif exposure_pct >= 25:
        exposure_label = "moderate"
    else:
        exposure_label = "lower"

    return {
        "card": "safety_exposure",
        "safety_exposure_index": exposure_value,
        "safety_exposure_pct": exposure_pct,
        "exposure_label": exposure_label,
        "route_safety_index": route_context.get("route_safety_index"),
        "route_visibility_index": route_context.get("route_visibility_index"),
        "route_crime_percentile": route_context.get("route_crime_percentile"),
        "corridor_safety_exposure": route_context.get("corridor_safety_exposure"),
        "stop_buffer_safety_exposure": route_context.get("stop_buffer_safety_exposure"),
        "lsoa_match_count": route_context.get("lsoa_match_count"),
        "note": "Corridor-weighted LSOA night safety proxy from crime severity and visibility context. Not a personal danger prediction.",
    }


def _lighting_proxy(journey: dict) -> dict:
    legs = journey.get("legs", [])
    from data.api.support import _count_within_buffer, _get_layer

    total_lamps = 0
    walk_segments = 0

    for leg in legs:
        if not leg.get("is_walking"):
            continue
        walk_segments += 1
        dep = leg.get("departure_point", {})
        lat = dep.get("lat")
        lon = dep.get("lon")
        if lat is None or lon is None:
            continue
        lamps = _count_within_buffer(
            _get_layer("lamps"), lat, lon, SUPPORT_BUFFER_METERS
        )
        total_lamps += len(lamps)

    mean_lamps = round(total_lamps / walk_segments, 1) if walk_segments else 0

    if mean_lamps >= 15:
        label = "well-lit infrastructure"
    elif mean_lamps >= 5:
        label = "moderate lighting"
    elif mean_lamps >= 1:
        label = "sparse lighting"
    else:
        label = "no recorded lighting"

    return {
        "card": "lighting_proxy",
        "walk_segments_assessed": walk_segments,
        "total_lamps_on_walks": total_lamps,
        "mean_lamps_per_walk": mean_lamps,
        "label": label,
        "note": "Infrastructure presence from OSM, not measured brightness.",
    }


# ── Main endpoint ────────────────────────────────────────────────

@router.get("/cards")
async def get_comparison_cards(
    origin: str = Query(...),
    destination: str = Query(...),
    times: str = Query(
        "14:00,19:00,00:00",
        description="Comma-separated departure times",
    ),
    date: str = Query(""),
):
    """
    Core endpoint: return comparison cards for each departure time.
    This powers the Page 3 side-by-side comparison.
    """
    time_list = [t.strip() for t in times.split(",")]
    headway_data = _load_headway()
    results = {}

    for idx, t in enumerate(time_list):
        if idx > 0:
            await asyncio.sleep(0.6)

        try:
            params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(t)}
            if date:
                params["date"] = date
            data = await tfl_get(
                f"/Journey/JourneyResults/{origin}/to/{destination}", params
            )
            journeys_raw = data.get("journeys", [])
            if not journeys_raw:
                results[t] = None
                continue

            journey = await _parse_journey_with_fare(
                journeys_raw[0],
                origin=origin,
                destination=destination,
                time=t,
            )
            route_context = _route_support_activity_context(journey)
            safety_context = _route_safety_context(journey)
            support_card = _support_access(journey, t, route_context)

            cards = {
                "functional_cost": _functional_cost(journey),
                "waiting_burden": _waiting_burden(journey, headway_data, t),
                "service_uncertainty": await _service_uncertainty(
                    journey, headway_data, t
                ),
                "support_access": support_card,
                "activity_context": _activity_context(
                    journey,
                    t,
                    support_card=support_card,
                    route_context=route_context,
                ),
                "safety_exposure": _safety_exposure(
                    journey,
                    route_context=safety_context,
                ),
                "lighting_proxy": _lighting_proxy(journey),
            }

            results[t] = {
                "journey": journey,
                "cards": cards,
            }
        except Exception:
            results[t] = None

    return {
        "origin": origin,
        "destination": destination,
        "options": results,
        "note": "Each card is an independent dimension. No single score.",
    }


@router.get("/hourly")
async def get_hourly_curves(
    origin: str = Query(...),
    destination: str = Query(...),
    times: str = Query("", description="Optional comma-separated departure times"),
    start_hour: int = Query(18, description="Start hour (inclusive)"),
    end_hour: int = Query(1, description="End hour (inclusive, wraps midnight)"),
    date: str = Query(""),
):
    """
    Compute key metrics at each hour for time-of-day curves (Page 6).
    Returns waiting_burden, support_availability, recovery_penalty per hour.
    """
    headway_data = _load_headway()

    if times.strip():
        time_list = [t.strip() for t in times.split(",") if t.strip()]
    else:
        hours = []
        h = start_hour
        while True:
            hours.append(h)
            if h == end_hour:
                break
            h = (h + 1) % 24
        time_list = [f"{h:02d}:00" for h in hours]

    curves: dict = {}
    for t in time_list:
        params = {**_ROUTE_PARAMS_BASE, "time": _to_tfl_time(t)}
        if date:
            params["date"] = date

        data = await tfl_get(
            f"/Journey/JourneyResults/{origin}/to/{destination}",
            params,
            raise_on_error=False,
        )
        journeys_raw = data.get("journeys", []) if isinstance(data, dict) else []
        if not journeys_raw:
            curves[t] = None
            continue

        journey = await _parse_journey_with_fare(
            journeys_raw[0],
            origin=origin,
            destination=destination,
            time=t,
        )
        wb = _waiting_burden(journey, headway_data, t)
        sa = _support_access(journey, t)
        safety = _safety_exposure(journey, route_context=_route_safety_context(journey))
        uncertainty = _hourly_uncertainty_score(journey, headway_data, t)

        # Recovery: max missed-connection penalty
        band = time_to_band(t)
        max_penalty = 0
        for leg in journey.get("legs", []):
            if leg.get("is_walking"):
                continue
            lid = leg.get("line_id", "")
            hw = headway_data.get(lid, {}).get(band, 15)
            if hw > max_penalty:
                max_penalty = hw

        curves[t] = {
            "duration_min": journey["duration_min"],
            "waiting_burden": wb["total_expected_wait_min"],
            "wait_share": wb["wait_share_of_journey"],
            "support_open": sa["total_support_open"],
            "support_ratio": sa["support_open_ratio"],
            "uncertainty_score_pct": uncertainty["uncertainty_score_pct"],
            "mean_headway_gap_ratio": uncertainty["mean_headway_gap_ratio"],
            "safety_score_pct": round(float(safety["route_safety_index"]) * 100)
            if safety.get("route_safety_index") is not None
            else None,
            "safety_exposure_pct": safety.get("safety_exposure_pct"),
            "max_recovery_penalty_min": max_penalty,
        }

    return {
        "origin": origin,
        "destination": destination,
        "curves": curves,
    }
