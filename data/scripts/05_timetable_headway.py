"""
ETL Step 5: Timetable headway computation
Data source: #2 TfL Journey Planner timetables (TransXChange XML ZIP)

Output:
  data/processed/headway_by_route_time.json

Note: The TfL timetable ZIP contains TransXChange XML files.
Full parsing is complex; this script provides the framework.
For the prototype, you may also manually curate headway data
from TfL's published frequency tables.
"""

import json
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "raw"
OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)


def generate_placeholder_headway():
    """
    Generate placeholder headway data for common lines.
    Replace with actual parsed timetable data when available.

    Format: { line_id: { time_band: headway_minutes } }
    Time bands: am_peak, inter_peak, pm_peak, evening, late_night
    """
    # Approximate headways based on TfL published frequencies
    headway = {
        "victoria": {"am_peak": 2, "inter_peak": 3, "pm_peak": 2, "evening": 5, "late_night": 10},
        "central": {"am_peak": 2, "inter_peak": 3, "pm_peak": 2, "evening": 5, "late_night": 10},
        "northern": {"am_peak": 2, "inter_peak": 3, "pm_peak": 2, "evening": 5, "late_night": 10},
        "jubilee": {"am_peak": 2, "inter_peak": 3, "pm_peak": 2, "evening": 5, "late_night": 10},
        "piccadilly": {"am_peak": 3, "inter_peak": 4, "pm_peak": 3, "evening": 6, "late_night": 10},
        "district": {"am_peak": 3, "inter_peak": 5, "pm_peak": 3, "evening": 7, "late_night": 12},
        "metropolitan": {"am_peak": 4, "inter_peak": 6, "pm_peak": 4, "evening": 8, "late_night": 15},
        "circle": {"am_peak": 5, "inter_peak": 7, "pm_peak": 5, "evening": 10, "late_night": 15},
        "hammersmith-city": {"am_peak": 5, "inter_peak": 7, "pm_peak": 5, "evening": 10, "late_night": 15},
        "bakerloo": {"am_peak": 3, "inter_peak": 5, "pm_peak": 3, "evening": 7, "late_night": 12},
        "elizabeth": {"am_peak": 3, "inter_peak": 5, "pm_peak": 3, "evening": 7, "late_night": 15},
        "dlr": {"am_peak": 4, "inter_peak": 5, "pm_peak": 4, "evening": 7, "late_night": 10},
        "overground": {"am_peak": 5, "inter_peak": 7, "pm_peak": 5, "evening": 10, "late_night": 15},
        # Bus lines - generic by frequency tier
        "bus_high_freq": {"am_peak": 5, "inter_peak": 7, "pm_peak": 5, "evening": 10, "late_night": 15},
        "bus_med_freq": {"am_peak": 8, "inter_peak": 10, "pm_peak": 8, "evening": 15, "late_night": 20},
        "bus_low_freq": {"am_peak": 12, "inter_peak": 15, "pm_peak": 12, "evening": 20, "late_night": 30},
        "night_bus": {"am_peak": 30, "inter_peak": 30, "pm_peak": 30, "evening": 15, "late_night": 15},
    }

    out_path = OUT / "headway_by_route_time.json"
    with open(out_path, "w") as f:
        json.dump(headway, f, indent=2)
    print(f"[OK] Wrote placeholder headway for {len(headway)} lines to {out_path}")
    print("  Replace with actual timetable data for production use.")


if __name__ == "__main__":
    generate_placeholder_headway()
