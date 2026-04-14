"""
ETL Step 10: Fairness grid computation (Page 5)

Computes day-vs-night *relative drop* for five dimensions at
MSOA level.  Each MSOA gets:

  day_value   – metric during inter_peak
  night_value – metric during late_night
  drop_ratio  – (day - night) / day  (higher = bigger loss)
  percentile  – where this MSOA sits city-wide

Dimensions:
  1. waiting_burden_increase
  2. support_access_loss
  3. recovery_difficulty_increase
  4. activity_decline
  5. low_light_walking_burden

Requires:
  data/processed/naptan_london.geojson
  data/processed/headway_by_route_time.json
  data/processed/shops_late_open.geojson (+ pharmacies, toilets, etc.)
  data/processed/nighttime_economy_msoa.json
  data/processed/lit_ways_segments.json
  data/raw/msoa_boundaries.geojson  (MSOA polygons)

Output:
  data/processed/fairness_waiting.json
  data/processed/fairness_support.json
  data/processed/fairness_recovery.json
  data/processed/fairness_activity.json
  data/processed/fairness_lighting.json
"""

import json
from pathlib import Path
import numpy as np

OUT = Path(__file__).resolve().parent.parent / "processed"
RAW = Path(__file__).resolve().parent.parent / "raw"
OUT.mkdir(exist_ok=True)


def _add_percentiles(data: dict, field: str = "drop_ratio") -> dict:
    values = sorted(v.get(field, 0) for v in data.values() if isinstance(v, dict))
    for v in data.values():
        if not isinstance(v, dict):
            continue
        val = v.get(field, 0)
        idx = np.searchsorted(values, val)
        v["percentile"] = round(idx / max(len(values), 1), 2)
    return data


def generate_placeholder_fairness():
    """
    Generate placeholder fairness data for demonstration.
    In production, replace with real MSOA-level computation using
    the data sources listed above.
    """
    # Sample inner / outer London MSOAs for illustration
    sample_msoas = {
        "E02000001": {"name": "City of London 001", "type": "inner"},
        "E02000564": {"name": "Camden 016", "type": "inner"},
        "E02000975": {"name": "Hackney 013", "type": "inner"},
        "E02000170": {"name": "Barnet 027", "type": "outer"},
        "E02000310": {"name": "Bromley 015", "type": "outer"},
        "E02000400": {"name": "Croydon 022", "type": "outer"},
        "E02000615": {"name": "Ealing 019", "type": "outer"},
        "E02000830": {"name": "Greenwich 008", "type": "inner"},
        "E02001100": {"name": "Lambeth 020", "type": "inner"},
        "E02001350": {"name": "Newham 014", "type": "inner"},
    }

    def _make_layer(inner_day, inner_night, outer_day, outer_night):
        layer = {}
        for code, info in sample_msoas.items():
            if info["type"] == "inner":
                d, n = inner_day, inner_night
            else:
                d, n = outer_day, outer_night
            drop = round((d - n) / d, 3) if d > 0 else 0
            layer[code] = {
                "name": info["name"],
                "day_value": d,
                "night_value": n,
                "drop_ratio": drop,
            }
        return _add_percentiles(layer)

    layers = {
        "fairness_waiting.json": _make_layer(5, 12, 8, 22),
        "fairness_support.json": _make_layer(15, 4, 8, 1),
        "fairness_recovery.json": _make_layer(6, 2, 4, 1),
        "fairness_activity.json": _make_layer(0.8, 0.3, 0.5, 0.1),
        "fairness_lighting.json": _make_layer(0.75, 0.75, 0.45, 0.45),
    }

    for filename, data in layers.items():
        out_path = OUT / filename
        with open(out_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"[OK] Wrote {filename} ({len(data)} zones)")

    print("\nPlaceholder fairness data generated.")
    print("Replace with real MSOA-level computation for production.")


if __name__ == "__main__":
    generate_placeholder_fairness()
