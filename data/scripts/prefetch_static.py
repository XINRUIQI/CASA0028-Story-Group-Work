#!/usr/bin/env python3
"""Pre-fetch API responses and save as static JSON for GitHub Pages deployment.

Run while the backend is up:
    cd <repo-root>
    source .venv/bin/activate
    python data/scripts/prefetch_static.py

The resulting files land in viz/public/static-data/ and are committed to git.
The frontend api.ts falls back to these when the live API is unreachable.
"""

import json
import os
import sys
import urllib.request
import urllib.error

API = os.environ.get("API_BASE", "http://localhost:8000")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "viz", "public", "static-data")

PRESET_ROUTES = [
    ("940GZZLUESQ", "HUBSVS"),
    ("940GZZLUSTD", "940GZZLUBXN"),
    ("940GZZLUKSX", "940GZZLUBKG"),
    ("940GZZLUPAC", "HUBGNW"),
]

HOURLY_TIMES = "14:00,19:00,00:00"
COMPARE_TIMES = "14:00,19:00,00:00"

FAIRNESS_LAYERS = [
    "waiting_burden_increase",
    "support_access_loss",
    "recovery_difficulty_increase",
    "activity_decline",
    "low_light_walking_burden",
]


def static_key(path: str, params=None) -> str:
    """Must match the frontend staticKey() in api.ts exactly."""
    d = path.lstrip("/").replace("/", "-")
    if not params:
        return f"{d}.json"
    vals = "__".join(
        v.replace(":", "-").replace(",", "_")
        for _, v in sorted(params.items())
    )
    return f"{d}/{vals}.json"


def fetch_and_save(path: str, params=None):
    url = f"{API}{path}"
    if params:
        qs = "&".join(f"{k}={urllib.request.quote(v, safe=',:')}" for k, v in params.items())
        url += f"?{qs}"

    key = static_key(path, params)
    out_path = os.path.join(OUT, key)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
        size = os.path.getsize(out_path)
        print(f"  \u2713 {key} ({size:,} bytes)")
        return data
    except Exception as e:
        print(f"  \u2717 {key}: {e}")
        return None


def main():
    # Quick health check
    try:
        urllib.request.urlopen(f"{API}/docs", timeout=5)
    except Exception:
        print(f"ERROR: Backend not reachable at {API}")
        print("Start it first:  uvicorn data.main:app --reload --port 8000")
        sys.exit(1)

    os.makedirs(OUT, exist_ok=True)
    print(f"Prefetching from {API} -> {OUT}/\n")

    # ── 1. Compare cards (hourly) — choose page ──
    print("── Compare cards (hourly, choose page) ──")
    for origin, dest in PRESET_ROUTES:
        fetch_and_save("/compare/cards", {
            "origin": origin,
            "destination": dest,
            "times": HOURLY_TIMES,
        })

    # ── 2. Compare cards (3 times) — compare page ──
    print("\n── Compare cards (3 times, compare page) ──")
    for origin, dest in PRESET_ROUTES:
        fetch_and_save("/compare/cards", {
            "origin": origin,
            "destination": dest,
            "times": COMPARE_TIMES,
        })

    # ── 3. Journey compare — compare page ──
    print("\n── Journey compare ──")
    for origin, dest in PRESET_ROUTES:
        fetch_and_save("/journey/compare", {
            "origin": origin,
            "destination": dest,
            "times": COMPARE_TIMES,
        })

    # ── 4. Plan journey — unpack page ──
    print("\n── Plan journey (unpack page) ──")
    for origin, dest in PRESET_ROUTES:
        fetch_and_save("/journey/plan", {
            "origin": origin,
            "destination": dest,
            "time": "21:00",
        })

    # ── 5. Fairness layers ──
    print("\n── Fairness layers ──")
    for layer in FAIRNESS_LAYERS:
        fetch_and_save(f"/fairness/layer/{layer}")

    total = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fns in os.walk(OUT)
        for f in fns
        if f.endswith(".json")
    )
    print(f"\n\u2705 Done! Total static data: {total:,} bytes")


if __name__ == "__main__":
    main()
