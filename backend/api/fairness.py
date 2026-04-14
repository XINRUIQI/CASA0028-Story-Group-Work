"""
City-wide fairness analysis (Page 5).

Answers: which areas lose the most mobility support after dark?
Computes *relative drop* from daytime to nighttime, not absolute night values.

Pre-computed results are loaded from data/processed/fairness_*.json.
If those files don't exist yet, the ETL script data/scripts/10_fairness_grid.py
must be run first.

Five switchable layers:
  1. waiting_burden_increase
  2. support_access_loss
  3. recovery_difficulty_increase
  4. activity_decline
  5. low_light_walking_burden
"""

import json
from typing import Optional

from fastapi import APIRouter, Path, Query

from backend.core.config import PROCESSED_DIR

router = APIRouter(prefix="/fairness", tags=["fairness"])


def _load(filename: str) -> dict:
    filepath = PROCESSED_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


_LAYER_FILES = {
    "waiting_burden_increase": "fairness_waiting.json",
    "support_access_loss": "fairness_support.json",
    "recovery_difficulty_increase": "fairness_recovery.json",
    "activity_decline": "fairness_activity.json",
    "low_light_walking_burden": "fairness_lighting.json",
}

_ALL_LAYERS_CACHE: Optional[dict] = None


def _get_all_layers() -> dict:
    """Lazy-load all fairness layers into a single dict."""
    global _ALL_LAYERS_CACHE
    if _ALL_LAYERS_CACHE is None:
        _ALL_LAYERS_CACHE = {}
        for layer_name, filename in _LAYER_FILES.items():
            _ALL_LAYERS_CACHE[layer_name] = _load(filename)
    return _ALL_LAYERS_CACHE


@router.get("/layers")
async def list_layers():
    """List available fairness layers with data availability status."""
    layers = _get_all_layers()
    return {
        "layers": [
            {
                "id": name,
                "available": bool(data),
                "zone_count": len(data),
            }
            for name, data in layers.items()
        ]
    }


@router.get("/layer/{layer_id}")
async def get_layer(
    layer_id: str,
    zone_type: str = Query("msoa", description="msoa | lsoa | borough"),
):
    """
    Return a single fairness layer as a zone-level dict.
    Each zone entry contains:
      - day_value, night_value, drop_ratio, percentile
    """
    layers = _get_all_layers()
    data = layers.get(layer_id)
    if data is None:
        return {
            "layer_id": layer_id,
            "error": f"Unknown layer. Available: {list(_LAYER_FILES.keys())}",
        }
    if not data:
        return {
            "layer_id": layer_id,
            "note": f"Data file {_LAYER_FILES[layer_id]} not yet generated.",
            "zones": {},
        }
    return {"layer_id": layer_id, "zone_type": zone_type, "zones": data}


@router.get("/zone/{zone_code}")
async def get_zone_profile(zone_code: str = Path(...)):
    """
    Return all five fairness dimensions for a single zone.
    Useful for tooltip / detail panel.
    """
    layers = _get_all_layers()
    profile = {}
    for layer_name, data in layers.items():
        zone_data = data.get(zone_code, {})
        profile[layer_name] = zone_data if zone_data else None
    return {"zone_code": zone_code, "profile": profile}


@router.get("/summary")
async def fairness_summary():
    """
    High-level city summary: which dimensions show the biggest
    day→night drops on average and at worst-case zones.
    """
    layers = _get_all_layers()
    summary = {}
    for layer_name, data in layers.items():
        if not data:
            summary[layer_name] = {"available": False}
            continue
        drops = [
            v.get("drop_ratio", 0)
            for v in data.values()
            if isinstance(v, dict) and v.get("drop_ratio") is not None
        ]
        if not drops:
            summary[layer_name] = {"available": True, "zone_count": len(data)}
            continue
        summary[layer_name] = {
            "available": True,
            "zone_count": len(data),
            "mean_drop": round(sum(drops) / len(drops), 3),
            "max_drop": round(max(drops), 3),
            "min_drop": round(min(drops), 3),
        }
    return {"summary": summary}
