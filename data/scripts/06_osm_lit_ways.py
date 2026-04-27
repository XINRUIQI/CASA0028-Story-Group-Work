"""
ETL Step 6: OSM lit=* road segments

Queries Overpass for highway ways tagged with lit=yes/no inside
the London bounding box.  Each way is reduced to its centroid so
downstream code can do a simple point-in-buffer check.

Output:
  data/processed/lit_ways_segments.json
    List of { lat, lon, lit, highway }
"""

import json
import time as _time
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)

OVERPASS_URLS = [
    "https://overpass.kumi.systems/api/interpreter",
    "http://overpass-api.de/api/interpreter",
]
LONDON_BBOX = "51.28,-0.51,51.69,0.33"


def _query_overpass(query: str) -> list:
    for url in OVERPASS_URLS:
        print(f"  Trying {url.split('/')[2]}...")
        for attempt in range(2):
            try:
                resp = requests.post(url, data={"data": query}, timeout=300)
                if resp.status_code == 200:
                    data = resp.json().get("elements", [])
                    print(f"  Got {len(data)} elements")
                    return data
                if resp.status_code in (429, 504):
                    wait = 30 * (attempt + 1)
                    print(f"  [{resp.status_code}] Retrying in {wait}s...")
                    _time.sleep(wait)
                else:
                    print(f"  [ERROR] HTTP {resp.status_code}")
                    break
            except requests.exceptions.Timeout:
                print("  [TIMEOUT]")
                break
            except Exception as e:
                print(f"  [ERROR] {e}")
                break
    return []


def fetch_lit_ways():
    """Fetch ways with lit=* and compute centroid for each."""
    query = f"""
    [out:json][timeout:300];
    (
      way["lit"]["highway"~"^(residential|tertiary|secondary|primary|trunk|footway|cycleway|path|pedestrian|living_street|unclassified)$"]({LONDON_BBOX});
    );
    out body geom;
    """
    print("[OSM] Fetching lit=* road ways (may take several minutes)...")
    elements = _query_overpass(query)

    segments = []
    for el in elements:
        geom = el.get("geometry", [])
        if not geom:
            continue
        lats = [p["lat"] for p in geom]
        lons = [p["lon"] for p in geom]
        centroid_lat = sum(lats) / len(lats)
        centroid_lon = sum(lons) / len(lons)
        tags = el.get("tags", {})
        segments.append({
            "lat": round(centroid_lat, 6),
            "lon": round(centroid_lon, 6),
            "lit": tags.get("lit", "unknown"),
            "highway": tags.get("highway", ""),
        })

    out_path = OUT / "lit_ways_segments.json"
    with open(out_path, "w") as f:
        json.dump(segments, f)
    print(f"[OK] Wrote {len(segments)} lit-way segments to {out_path}")


if __name__ == "__main__":
    fetch_lit_ways()
