"""
ETL Step 2: Station Facilities (step-free, toilets, lift disruptions)
Data sources:
  #6 Station topology / step-free / toilets
  #7 Bus stations with public toilets

Output:
  data/processed/station_facilities.json
"""

import json
from pathlib import Path
import pandas as pd

RAW = Path(__file__).resolve().parent.parent / "raw"
OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)


def process_station_facilities():
    """Parse step-free access and toilet data into a station lookup."""
    # Adapt to actual filenames from TfL open data download
    step_free_path = RAW / "step-free-tube-guide.csv"
    toilets_path = RAW / "bus-stations-toilets.csv"

    facilities: dict[str, dict] = {}

    # Step-free access
    if step_free_path.exists():
        df = pd.read_csv(step_free_path)
        name_col = next((c for c in df.columns if "station" in c.lower() or "name" in c.lower()), None)
        access_col = next((c for c in df.columns if "step" in c.lower() or "access" in c.lower()), None)
        if name_col and access_col:
            for _, row in df.iterrows():
                key = str(row[name_col]).strip()
                facilities[key] = {
                    "step_free": str(row[access_col]).strip().lower(),
                    "toilet": False,
                    "lift_disruption": False,
                }
        print(f"[OK] Parsed step-free data for {len(facilities)} stations.")
    else:
        print(f"[SKIP] {step_free_path} not found.")

    # Bus station toilets
    if toilets_path.exists():
        df = pd.read_csv(toilets_path)
        name_col = next((c for c in df.columns if "station" in c.lower() or "name" in c.lower()), None)
        if name_col:
            for _, row in df.iterrows():
                key = str(row[name_col]).strip()
                if key in facilities:
                    facilities[key]["toilet"] = True
                else:
                    facilities[key] = {
                        "step_free": "unknown",
                        "toilet": True,
                        "lift_disruption": False,
                    }
        print(f"[OK] Added toilet info. Total stations: {len(facilities)}")
    else:
        print(f"[SKIP] {toilets_path} not found.")

    out_path = OUT / "station_facilities.json"
    with open(out_path, "w") as f:
        json.dump(facilities, f, indent=2)
    print(f"[OK] Wrote station facilities to {out_path}")


if __name__ == "__main__":
    process_station_facilities()
