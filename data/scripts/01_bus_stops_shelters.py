"""
ETL Step 1: Bus Stops + Shelters + Stations
Data sources:
  #3 Bus Stop Locations and Routes (London Datastore CSV)
  #4 Bus Shelters (TfL GIS Open Data Hub)
  #5 Bus Stops / Bus Stations (TfL GIS Open Data Hub)

Output:
  data/processed/bus_stops.geojson
  data/processed/stop_shelter_status.json
"""

import json
from pathlib import Path

import pandas as pd
import geopandas as gpd

RAW = Path(__file__).resolve().parent.parent / "raw"
OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)


def process_bus_stops():
    """Process bus stop locations into GeoJSON."""
    # Adapt filenames to your actual downloaded files
    stops_path = RAW / "bus-stops.csv"
    if not stops_path.exists():
        print(f"[SKIP] {stops_path} not found. Download from London Datastore first.")
        return

    df = pd.read_csv(stops_path)
    # Expected columns vary; adapt to actual schema
    lat_col = next((c for c in df.columns if "lat" in c.lower()), None)
    lon_col = next((c for c in df.columns if "lon" in c.lower() or "lng" in c.lower()), None)
    if not lat_col or not lon_col:
        print("[ERROR] Cannot find lat/lon columns in bus stops CSV.")
        return

    gdf = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df[lon_col], df[lat_col]),
        crs="EPSG:4326",
    )
    out_path = OUT / "bus_stops.geojson"
    gdf.to_file(out_path, driver="GeoJSON")
    print(f"[OK] Wrote {len(gdf)} bus stops to {out_path}")


def process_shelters():
    """Join shelter data with stops to produce shelter status lookup."""
    shelters_path = RAW / "bus_shelters.shp"
    geojson_alt = RAW / "bus_shelters.geojson"
    src = shelters_path if shelters_path.exists() else geojson_alt

    if not src.exists():
        print(f"[SKIP] Bus shelter file not found at {RAW}. Download from TfL GIS Hub.")
        return

    gdf = gpd.read_file(src)

    # Build a lookup: stop_id -> { has_shelter: true, shelter_code: ... }
    lookup = {}
    id_col = next((c for c in gdf.columns if "stop" in c.lower() and "id" in c.lower()), None)
    if id_col:
        for _, row in gdf.iterrows():
            stop_id = str(row[id_col])
            lookup[stop_id] = {"has_shelter": True}

    out_path = OUT / "stop_shelter_status.json"
    with open(out_path, "w") as f:
        json.dump(lookup, f)
    print(f"[OK] Wrote shelter status for {len(lookup)} stops to {out_path}")


if __name__ == "__main__":
    process_bus_stops()
    process_shelters()
