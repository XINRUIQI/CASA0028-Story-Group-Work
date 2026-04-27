"""
ETL Step 3: OSM Support Layers (shops, pharmacy, toilets, street lamps)
Data source: #14 OpenStreetMap via Overpass API

Output:
  data/processed/shops_late_open.geojson
  data/processed/pharmacies.geojson
  data/processed/toilets.geojson
  data/processed/street_lamps.geojson
"""

import json
import time
from pathlib import Path
import requests

OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)

OVERPASS_URLS = [
    "https://overpass.kumi.systems/api/interpreter",
    "http://overpass-api.de/api/interpreter",
]

# London bounding box (south, west, north, east)
LONDON_BBOX = "51.28,-0.51,51.69,0.33"


def _query_overpass(query: str) -> list:
    """Run an Overpass API query, trying multiple servers."""
    for url in OVERPASS_URLS:
        print(f"  Trying {url.split('/')[2]}...")
        for attempt in range(2):
            try:
                resp = requests.post(url, data={"data": query}, timeout=180)
                if resp.status_code == 200:
                    data = resp.json().get("elements", [])
                    print(f"  Got {len(data)} elements")
                    return data
                elif resp.status_code in (429, 504):
                    wait = 20 * (attempt + 1)
                    print(f"  [{resp.status_code}] Retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    print(f"  [ERROR] HTTP {resp.status_code}")
                    break
            except requests.exceptions.Timeout:
                print(f"  [TIMEOUT] Trying next server...")
                break
            except Exception as e:
                print(f"  [ERROR] {e}")
                break
    print("  [FAIL] All servers exhausted.")
    return []


def _elements_to_geojson(elements: list) -> dict:
    """Convert Overpass elements to GeoJSON FeatureCollection."""
    features = []
    for el in elements:
        if "lat" not in el or "lon" not in el:
            continue
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [el["lon"], el["lat"]],
            },
            "properties": {k: v for k, v in el.get("tags", {}).items()},
        })
    return {"type": "FeatureCollection", "features": features}


def _save(geojson: dict, filename: str):
    out_path = OUT / filename
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"  [OK] Wrote {len(geojson['features'])} features to {out_path}")


def fetch_shops():
    """Fetch convenience/supermarket shops with opening_hours in London bbox."""
    query = f"""
    [out:json][timeout:180];
    (
      node["shop"~"convenience|supermarket"]["opening_hours"]({LONDON_BBOX});
    );
    out body;
    """
    print("[1/4] Fetching convenience/supermarket shops...")
    elements = _query_overpass(query)
    _save(_elements_to_geojson(elements), "shops_late_open.geojson")


def fetch_pharmacies():
    query = f"""
    [out:json][timeout:120];
    (
      node["amenity"="pharmacy"]({LONDON_BBOX});
    );
    out body;
    """
    print("[2/4] Fetching pharmacies...")
    elements = _query_overpass(query)
    _save(_elements_to_geojson(elements), "pharmacies.geojson")


def fetch_toilets():
    query = f"""
    [out:json][timeout:120];
    (
      node["amenity"="toilets"]({LONDON_BBOX});
    );
    out body;
    """
    print("[3/4] Fetching toilets...")
    elements = _query_overpass(query)
    _save(_elements_to_geojson(elements), "toilets.geojson")


def fetch_street_lamps():
    query = f"""
    [out:json][timeout:300];
    (
      node["highway"="street_lamp"]({LONDON_BBOX});
    );
    out body;
    """
    print("[4/4] Fetching street lamps (large dataset, may take a few minutes)...")
    elements = _query_overpass(query)
    _save(_elements_to_geojson(elements), "street_lamps.geojson")


if __name__ == "__main__":
    fetch_shops()
    time.sleep(5)
    fetch_pharmacies()
    time.sleep(5)
    fetch_toilets()
    time.sleep(5)
    fetch_street_lamps()
    print("\nDone. All OSM support layers saved to data/processed/")
