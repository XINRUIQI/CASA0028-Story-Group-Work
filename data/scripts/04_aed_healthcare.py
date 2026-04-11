"""
ETL Step 4: AED / Defibrillator + NHS Healthcare
Data sources:
  #16 NHS Service Search API
  #17 The Circuit / BHF defibrillator location data

Output:
  data/processed/aed_points.geojson
  data/processed/healthcare_points.geojson
"""

import json
import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "processed"
RAW = Path(__file__).resolve().parent.parent / "raw"
OUT.mkdir(exist_ok=True)


def process_aed():
    """Process BHF defibrillator CSV into GeoJSON."""
    aed_path = RAW / "defibrillators.csv"
    if not aed_path.exists():
        print(f"[SKIP] {aed_path} not found. Download from BHF / The Circuit.")
        return

    features = []
    with open(aed_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lat_key = next((k for k in row if "lat" in k.lower()), None)
            lon_key = next((k for k in row if "lon" in k.lower() or "lng" in k.lower()), None)
            if not lat_key or not lon_key:
                continue
            try:
                lat = float(row[lat_key])
                lon = float(row[lon_key])
            except (ValueError, TypeError):
                continue

            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    k: v for k, v in row.items()
                    if k not in (lat_key, lon_key)
                },
            })

    geojson = {"type": "FeatureCollection", "features": features}
    out_path = OUT / "aed_points.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(features)} AED points to {out_path}")


def process_healthcare():
    """
    Placeholder for NHS Service Search API integration.
    In practice you would query:
      GET https://api.nhs.uk/service-search/search?api-version=2
      with searchFields, $filter for pharmacy / urgent-care
    and convert results to GeoJSON.
    """
    healthcare_path = RAW / "healthcare_services.csv"
    if not healthcare_path.exists():
        print(f"[SKIP] {healthcare_path} not found.")
        print("  To populate: query NHS Service Search API for London pharmacies/urgent-care,")
        print("  save as CSV, then re-run this script.")

        # Write empty GeoJSON placeholder
        out_path = OUT / "healthcare_points.geojson"
        with open(out_path, "w") as f:
            json.dump({"type": "FeatureCollection", "features": []}, f)
        return

    features = []
    with open(healthcare_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lat_key = next((k for k in row if "lat" in k.lower()), None)
            lon_key = next((k for k in row if "lon" in k.lower() or "lng" in k.lower()), None)
            if not lat_key or not lon_key:
                continue
            try:
                lat = float(row[lat_key])
                lon = float(row[lon_key])
            except (ValueError, TypeError):
                continue
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {k: v for k, v in row.items() if k not in (lat_key, lon_key)},
            })

    geojson = {"type": "FeatureCollection", "features": features}
    out_path = OUT / "healthcare_points.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(features)} healthcare points to {out_path}")


if __name__ == "__main__":
    process_aed()
    process_healthcare()
