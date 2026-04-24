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

# Must mirror PresetJourneys.tsx — each preset's (origin, destination, times)
# lands both in /compare/cards and /journey/compare static fallbacks so the
# prototype works on GitHub Pages without a live backend.
PRESET_ROUTES = [
    # (origin, destination, ui_times)
    ("940GZZLUESQ", "HUBSVS", "18:00,21:00,23:30"),        # Late-night student
    ("940GZZLUSTD", "940GZZLUBXN", "18:00,21:00,23:30"),   # Budget traveller
    ("940GZZLUKSX", "940GZZLUBKG", "22:00,23:30,01:00"),   # Night-shift worker
    ("940GZZLULVT", "940GZZDLGRE", "18:00,21:00,23:30"),   # Unfamiliar traveller
]

CHOOSE_COMPARE_TIMES = "18:00,21:00,23:30"
COMPARE_TIMES = "14:00,19:00,00:00"
HOURLY_CURVE_TIMES = "06:00,09:00,12:00,15:00,18:00,21:00,24:00,03:00"

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

    # ── 1. Compare cards — per‑preset UI times (compare page) ──
    print("── Compare cards (preset UI times) ──")
    for origin, dest, ui_times in PRESET_ROUTES:
        fetch_and_save("/compare/cards", {
            "origin": origin,
            "destination": dest,
            "times": ui_times,
        })

    # ── 2. Compare cards — choose page shared default (only if not already fetched) ──
    print("\n── Compare cards (choose page default) ──")
    for origin, dest, ui_times in PRESET_ROUTES:
        if ui_times == CHOOSE_COMPARE_TIMES:
            continue
        fetch_and_save("/compare/cards", {
            "origin": origin,
            "destination": dest,
            "times": CHOOSE_COMPARE_TIMES,
        })

    # ── 3. Compare cards — 3‑time stress preset ──
    print("\n── Compare cards (stress preset) ──")
    for origin, dest, _ui_times in PRESET_ROUTES:
        fetch_and_save("/compare/cards", {
            "origin": origin,
            "destination": dest,
            "times": COMPARE_TIMES,
        })

    # ── 4. Compare hourly curves ──
    print("\n── Compare hourly curves ──")
    for origin, dest, _ui_times in PRESET_ROUTES:
        fetch_and_save("/compare/hourly", {
            "origin": origin,
            "destination": dest,
            "times": HOURLY_CURVE_TIMES,
        })

    # ── 5. Journey compare — per‑preset UI times ──
    print("\n── Journey compare (preset UI times) ──")
    for origin, dest, ui_times in PRESET_ROUTES:
        fetch_and_save("/journey/compare", {
            "origin": origin,
            "destination": dest,
            "times": ui_times,
        })

    # ── 6. Journey compare — stress preset ──
    print("\n── Journey compare (stress preset) ──")
    for origin, dest, _ui_times in PRESET_ROUTES:
        fetch_and_save("/journey/compare", {
            "origin": origin,
            "destination": dest,
            "times": COMPARE_TIMES,
        })

    # ── 7. Plan journey — unpack page ──
    print("\n── Plan journey (unpack page) ──")
    for origin, dest, _ui_times in PRESET_ROUTES:
        fetch_and_save("/journey/plan", {
            "origin": origin,
            "destination": dest,
            "time": "21:00",
        })

    # ── 8. Fairness layers ──
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
