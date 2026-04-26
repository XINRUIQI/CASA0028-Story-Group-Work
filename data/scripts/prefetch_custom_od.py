#!/usr/bin/env python3
"""Pre-fetch compare-cards data for a 10×10 station grid (up to 90 OD pairs).

Run while the backend is up:
    cd <repo-root>
    source .venv/bin/activate
    python data/scripts/prefetch_custom_od.py

Produces static JSON files in viz/public/static-data/ using the same
naming convention as prefetch_static.py so the existing frontend
loadStaticCompareCards() picks them up automatically.

Also writes viz/public/static-data/custom-od-stations.json — the station
list the frontend dropdown reads.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

API = os.environ.get("API_BASE", "http://localhost:8000")
OUT = os.path.join(
    os.path.dirname(__file__), "..", "..", "viz", "public", "static-data"
)

STATIONS = [
    {"id": "940GZZLUKSX", "name": "King's Cross St. Pancras", "zone": "Central-North"},
    {"id": "940GZZLULVT", "name": "Liverpool Street",        "zone": "Central-East"},
    {"id": "940GZZLUWLO", "name": "Waterloo",                "zone": "Central-South"},
    {"id": "940GZZLUOXC", "name": "Oxford Circus",           "zone": "Central-West"},
    {"id": "940GZZLUSTD", "name": "Stratford",               "zone": "East"},
    {"id": "940GZZLUBXN", "name": "Brixton",                 "zone": "South"},
    {"id": "940GZZLUEAB", "name": "Ealing Broadway",         "zone": "West"},
    {"id": "HUBSVS",      "name": "Seven Sisters",           "zone": "North"},
    {"id": "940GZZDLGRE", "name": "Greenwich",               "zone": "South-East"},
    {"id": "940GZZLUCTN", "name": "Camden Town",             "zone": "North-Central"},
]

COMPARE_TIMES = "18:00,21:00,23:30"

# Track progress
_success = 0
_fail = 0
_skip = 0


def static_key(path: str, params=None) -> str:
    """Must match the frontend staticKey() / loadStaticCompareCards() exactly."""
    d = path.lstrip("/").replace("/", "-")
    if not params:
        return f"{d}.json"
    vals = "__".join(
        v.replace(":", "-").replace(",", "_")
        for _, v in sorted(params.items())
    )
    return f"{d}/{vals}.json"


def fetch_and_save(path: str, params=None) -> bool:
    global _success, _fail, _skip

    key = static_key(path, params)
    out_path = os.path.join(OUT, key)

    if os.path.exists(out_path):
        size = os.path.getsize(out_path)
        if size > 200:
            _skip += 1
            print(f"  ⊘ {key} (exists, {size:,}B — skipped)")
            return True

    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    url = f"{API}{path}"
    if params:
        qs = "&".join(
            f"{k}={urllib.request.quote(v, safe=',: ')}"
            for k, v in params.items()
        )
        url += f"?{qs}"

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
        size = os.path.getsize(out_path)
        _success += 1
        print(f"  ✓ {key} ({size:,}B)")
        return True
    except Exception as e:
        _fail += 1
        print(f"  ✗ {key}: {e}")
        return False


def build_od_pairs() -> list[tuple[str, str, str, str]]:
    """Generate all origin≠destination pairs from STATIONS."""
    pairs = []
    for o in STATIONS:
        for d in STATIONS:
            if o["id"] == d["id"]:
                continue
            pairs.append((o["id"], d["id"], o["name"], d["name"]))
    return pairs


def write_station_manifest():
    """Write the station list so the frontend knows which ODs are available."""
    manifest_path = os.path.join(OUT, "custom-od-stations.json")
    payload = {
        "stations": STATIONS,
        "compareTimes": COMPARE_TIMES.split(","),
        "pairCount": len(STATIONS) * (len(STATIONS) - 1),
    }
    with open(manifest_path, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"\n✓ Station manifest: {manifest_path}")


def main():
    try:
        urllib.request.urlopen(f"{API}/docs", timeout=5)
    except Exception:
        print(f"ERROR: Backend not reachable at {API}")
        print("Start it first:  uvicorn data.main:app --reload --port 8000")
        sys.exit(1)

    os.makedirs(OUT, exist_ok=True)
    pairs = build_od_pairs()
    total = len(pairs)
    print(f"Prefetching {total} OD pairs from {API}")
    print(f"Times: {COMPARE_TIMES}")
    print(f"Output: {OUT}/\n")

    write_station_manifest()

    for idx, (origin, dest, o_name, d_name) in enumerate(pairs, 1):
        print(f"\n[{idx}/{total}] {o_name} → {d_name}")

        fetch_and_save("/compare/cards", {
            "origin": origin,
            "destination": dest,
            "times": COMPARE_TIMES,
        })

        time.sleep(0.3)

        fetch_and_save("/journey/compare", {
            "origin": origin,
            "destination": dest,
            "times": COMPARE_TIMES,
        })

        time.sleep(0.3)

    data_total = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fns in os.walk(OUT)
        for f in fns
        if f.endswith(".json")
    )
    print(f"\n{'=' * 50}")
    print(f"✅ Done!  success={_success}  skipped={_skip}  failed={_fail}")
    print(f"   Total static-data size: {data_total:,} bytes ({data_total / 1_000_000:.1f} MB)")


if __name__ == "__main__":
    main()
