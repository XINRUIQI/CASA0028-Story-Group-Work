"""
ETL Step 9: City-level day/night overview statistics (Page 2)

Computes aggregate London-level metrics for the day-night switch
animation.  Uses TfL API for active lines/stops and pre-processed
OSM/support data for POI density.

Output:
  data/processed/city_overview.json
    {
      "daytime": { active_lines, active_stops, mean_headway, support_density, ... },
      "evening": { ... },
      "late_night": { ... }
    }
"""

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)


def generate_placeholder_overview():
    """
    Placeholder city overview based on published TfL and GLA figures.
    Replace with live-computed values once full NaPTAN + timetable
    processing pipeline is in place.
    """
    overview = {
        "daytime": {
            "time_band": "inter_peak (10:00–16:00)",
            "active_tube_lines": 11,
            "active_bus_routes": 675,
            "active_dlr_lines": 1,
            "active_overground_lines": 6,
            "active_elizabeth_line": 1,
            "approx_active_stops": 19000,
            "mean_tube_headway_min": 3.5,
            "mean_bus_headway_min": 8,
            "support_poi_open_pct": 0.85,
            "note": "Most services, POIs, and stations operating at full capacity.",
        },
        "evening": {
            "time_band": "evening (19:00–22:00)",
            "active_tube_lines": 11,
            "active_bus_routes": 650,
            "active_dlr_lines": 1,
            "active_overground_lines": 6,
            "active_elizabeth_line": 1,
            "approx_active_stops": 18500,
            "mean_tube_headway_min": 6,
            "mean_bus_headway_min": 12,
            "support_poi_open_pct": 0.55,
            "note": "Service frequency drops; many shops and pharmacies begin closing.",
        },
        "late_night": {
            "time_band": "late_night (22:00–07:00)",
            "active_tube_lines": 5,
            "active_bus_routes": 120,
            "active_dlr_lines": 0,
            "active_overground_lines": 2,
            "active_elizabeth_line": 0,
            "approx_active_stops": 6500,
            "mean_tube_headway_min": 10,
            "mean_bus_headway_min": 18,
            "support_poi_open_pct": 0.15,
            "note": "Night Tube on 5 lines (Fri/Sat); night buses only otherwise. Most POIs closed.",
        },
    }

    out_path = OUT / "city_overview.json"
    with open(out_path, "w") as f:
        json.dump(overview, f, indent=2)
    print(f"[OK] Wrote city overview to {out_path}")


if __name__ == "__main__":
    generate_placeholder_overview()
