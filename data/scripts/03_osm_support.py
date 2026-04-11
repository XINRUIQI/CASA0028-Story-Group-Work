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
from pathlib import Path
import requests

OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)

OVERPASS_URL = "http://overpass-api.de/api/interpreter"


def _query_overpass(query: str) -> list[dict]:
    """Run an Overpass API query and return elements."""
    resp = requests.get(OVERPASS_URL, params={"data": query}, timeout=300)
    resp.raise_for_status()
    return resp.json().get("elements", [])


def _elements_to_geojson(elements: list[dict]) -> dict:
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


def fetch_shops():
    """Fetch shops with opening_hours in Greater London."""
    query = """
    [out:json][timeout:300];
    area["name"="Greater London"]["admin_level"="6"]->.london;
    (
      node["shop"]["opening_hours"](area.london);
    );
    out body;
    """
    print("[...] Fetching shops with opening_hours from OSM...")
    elements = _query_overpass(query)
    geojson = _elements_to_geojson(elements)
    out_path = OUT / "shops_late_open.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(geojson['features'])} shops to {out_path}")


def fetch_pharmacies():
    query = """
    [out:json][timeout:180];
    area["name"="Greater London"]["admin_level"="6"]->.london;
    (
      node["amenity"="pharmacy"](area.london);
    );
    out body;
    """
    print("[...] Fetching pharmacies from OSM...")
    elements = _query_overpass(query)
    geojson = _elements_to_geojson(elements)
    out_path = OUT / "pharmacies.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(geojson['features'])} pharmacies to {out_path}")


def fetch_toilets():
    query = """
    [out:json][timeout:180];
    area["name"="Greater London"]["admin_level"="6"]->.london;
    (
      node["amenity"="toilets"](area.london);
    );
    out body;
    """
    print("[...] Fetching toilets from OSM...")
    elements = _query_overpass(query)
    geojson = _elements_to_geojson(elements)
    out_path = OUT / "toilets.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(geojson['features'])} toilets to {out_path}")


def fetch_street_lamps():
    query = """
    [out:json][timeout:300];
    area["name"="Greater London"]["admin_level"="6"]->.london;
    (
      node["highway"="street_lamp"](area.london);
    );
    out body;
    """
    print("[...] Fetching street lamps from OSM...")
    elements = _query_overpass(query)
    geojson = _elements_to_geojson(elements)
    out_path = OUT / "street_lamps.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"[OK] Wrote {len(geojson['features'])} street lamps to {out_path}")


if __name__ == "__main__":
    fetch_shops()
    fetch_pharmacies()
    fetch_toilets()
    fetch_street_lamps()
