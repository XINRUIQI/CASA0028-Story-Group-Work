"""
ETL Step 8: NaPTAN stop points for Greater London

Source: DfT NaPTAN download
  https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv

Filters to London ATCO prefixes (490 = bus, 910/940 = rail, etc.)
and TfL modes.

Output:
  data/processed/naptan_london.geojson
"""

import json
from pathlib import Path
import pandas as pd

RAW = Path(__file__).resolve().parent.parent / "raw"
OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)

# London ATCO area codes
LONDON_ATCO_PREFIXES = (
    "490",   # London bus
    "910",   # National rail in London
    "940",   # London Underground / DLR / Overground
    "9400",  # Sub-prefix for some TfL stations
)


def process_naptan():
    csv_path = RAW / "NaPTAN.csv"
    alt_path = RAW / "Stops.csv"
    src = csv_path if csv_path.exists() else alt_path

    if not src.exists():
        print(f"[SKIP] NaPTAN CSV not found at {RAW}.")
        print("  Download from: https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv")
        return

    df = pd.read_csv(src, low_memory=False)

    atco_col = next(
        (c for c in df.columns if "atco" in c.lower() or "stop_id" in c.lower()),
        df.columns[0],
    )
    lat_col = next((c for c in df.columns if "lat" in c.lower()), None)
    lon_col = next((c for c in df.columns if "lon" in c.lower()), None)
    name_col = next((c for c in df.columns if "name" in c.lower() and "common" in c.lower()), None)
    if not name_col:
        name_col = next((c for c in df.columns if "name" in c.lower()), None)
    type_col = next((c for c in df.columns if "type" in c.lower() and "stop" in c.lower()), None)

    if not lat_col or not lon_col:
        print("[ERROR] Cannot find lat/lon columns.")
        return

    london = df[df[atco_col].astype(str).str.startswith(LONDON_ATCO_PREFIXES)]
    print(f"  Filtered to {len(london)} London stops from {len(df)} total.")

    features = []
    for _, row in london.iterrows():
        try:
            lat = float(row[lat_col])
            lon = float(row[lon_col])
        except (ValueError, TypeError):
            continue
        props = {
            "atco_code": str(row[atco_col]),
            "name": str(row[name_col]) if name_col else "",
            "stop_type": str(row[type_col]) if type_col else "",
        }
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": props,
        })

    geojson = {"type": "FeatureCollection", "features": features}
    out_path = OUT / "naptan_london.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(features)} London stops to {out_path}")


if __name__ == "__main__":
    process_naptan()
