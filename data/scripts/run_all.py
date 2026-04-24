"""
Master ETL runner: execute all data processing steps in order.

Usage:
  cd data/scripts
  python run_all.py

Or run individual steps:
  python 01_bus_stops_shelters.py
  python 02_station_facilities.py
  python 03_osm_support.py         (requires internet — Overpass API)
  python 04_aed_healthcare.py
  python 05_timetable_headway.py
  python 06_osm_lit_ways.py        (requires internet — Overpass API)
  python 07_nighttime_economy.py
  python 08_naptan_stops.py
  python 09_city_overview.py
  python 10_fairness_grid.py
"""

import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent

STEPS = [
    "01_bus_stops_shelters.py",
    "02_station_facilities.py",
    "03_osm_support.py",
    "04_aed_healthcare.py",
    "05_timetable_headway.py",
    "06_osm_lit_ways.py",
    "07_nighttime_economy.py",
    "08_naptan_stops.py",
    "09_city_overview.py",
    "10_fairness_grid.py",
    "11_fairness_explainability.py",
]


def main():
    for script in STEPS:
        path = SCRIPTS_DIR / script
        if not path.exists():
            print(f"\n[SKIP] {script} not found.")
            continue
        print(f"\n{'=' * 60}")
        print(f"Running: {script}")
        print(f"{'=' * 60}")
        result = subprocess.run([sys.executable, str(path)], cwd=str(SCRIPTS_DIR))
        if result.returncode != 0:
            print(f"[WARN] {script} exited with code {result.returncode}")

    print(f"\n{'=' * 60}")
    print("ETL complete. Check data/processed/ for output files.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
