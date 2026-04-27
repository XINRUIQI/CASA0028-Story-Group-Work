#!/usr/bin/env python3
"""Build a static explainability dataset for the fairness page.

This version avoids borough-wide simple averages for the main map layers.
Instead it measures how much of each borough's internal MSOA geography shows:
1. a visible night-time activity footprint,
2. support coverage that still clears a meaningful threshold, and
3. hotspots where activity remains but support is thin.
"""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = ROOT / "data" / "processed"
OUTPUT_PATH = ROOT / "viz" / "public" / "static-data" / "fairness-explainability.json"

INNER_BOROUGHS = {
    "Camden",
    "City of London",
    "Greenwich",
    "Hackney",
    "Hammersmith and Fulham",
    "Islington",
    "Kensington and Chelsea",
    "Lambeth",
    "Lewisham",
    "Newham",
    "Southwark",
    "Tower Hamlets",
    "Wandsworth",
    "Westminster",
}

THRESHOLDS = {
    "activity_footprint_min": 0.05,
    "support_coverage_min": 0.12,
    "mismatch_activity_min": 0.03,
    "mismatch_support_max": 0.09,
}

LAYER_META = {
    "mismatch_hotspots": {
        "label": "Activity-support mismatch",
        "accent": "var(--accent-amber)",
        "description": (
            "Share of MSOAs where late-night activity remains visible but support stays thin. "
            "This is the strongest fairness signal on the map."
        ),
    },
    "activity_footprint": {
        "label": "Night activity footprint",
        "accent": "var(--accent-blue)",
        "description": (
            "Share of MSOAs that still clear the activity threshold after dark. "
            "This asks where the night network still matters spatially within the borough."
        ),
    },
    "support_coverage": {
        "label": "Support coverage",
        "accent": "var(--accent-emerald)",
        "description": (
            "Share of MSOAs where support intensity still clears a meaningful threshold. "
            "Higher scores mean more of the borough stays recoverable after dark."
        ),
    },
}


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def pstdev(values: list[float]) -> float:
    if len(values) <= 1:
        return 0.0
    avg = mean(values)
    return (sum((value - avg) ** 2 for value in values) / len(values)) ** 0.5


def extract_borough(area_name: str) -> str:
    return area_name.rsplit(" ", 1)[0].strip()


def load_borough_metrics() -> dict[str, dict[str, float | int | str]]:
    rows_by_borough: dict[str, list[tuple[float, float]]] = defaultdict(list)
    with (PROCESSED_DIR / "msoa_night_support_activity.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        for row in csv.DictReader(handle):
            borough = extract_borough(row["msoa_name"])
            activity = float(row["activity_index"] or 0.0)
            support = float(row["support_index"] or 0.0)
            rows_by_borough[borough].append((activity, support))

    supply_change: dict[str, list[float]] = defaultdict(list)
    with (PROCESSED_DIR / "borough_night_supply_change.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        for row in csv.DictReader(handle):
            supply_change[row["borough_name"]].append(float(row["pct_change"] or 0.0))

    borough_metrics: dict[str, dict[str, float | int | str]] = {}
    for borough, rows in sorted(rows_by_borough.items()):
        activity_values = [row[0] for row in rows]
        support_values = [row[1] for row in rows]
        total = len(rows)

        activity_footprint_count = sum(
            activity >= THRESHOLDS["activity_footprint_min"]
            for activity in activity_values
        )
        support_coverage_count = sum(
            support >= THRESHOLDS["support_coverage_min"]
            for support in support_values
        )
        mismatch_hotspot_count = sum(
            activity >= THRESHOLDS["mismatch_activity_min"]
            and support <= THRESHOLDS["mismatch_support_max"]
            for activity, support in rows
        )

        supply_values = supply_change.get(borough, [])
        borough_metrics[borough] = {
            "bucket": "Inner" if borough in INNER_BOROUGHS else "Outer",
            "msoa_count": total,
            "activity_index_mean": round(mean(activity_values), 4),
            "support_index_mean": round(mean(support_values), 4),
            "supply_change_mean": round(mean(supply_values), 4),
            "supply_change_spread": round(pstdev(supply_values), 4),
            "activity_footprint": round(activity_footprint_count / total, 4),
            "activity_footprint_count": activity_footprint_count,
            "support_coverage": round(support_coverage_count / total, 4),
            "support_coverage_count": support_coverage_count,
            "mismatch_hotspots": round(mismatch_hotspot_count / total, 4),
            "mismatch_hotspots_count": mismatch_hotspot_count,
        }

    return borough_metrics


def load_audience_shift() -> list[dict[str, float | str]]:
    pairs: dict[tuple[str, str], dict[str, float]] = defaultdict(dict)
    with (PROCESSED_DIR / "night_user_profiles.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        for row in csv.DictReader(handle):
            if row["source"] != "night_bus_overview":
                continue
            key = (row["dimension"], row["profile_category"])
            pairs[key][row["profile_group"]] = float(row["value"])

    shifts: list[dict[str, float | str]] = []
    for (dimension, category), values in pairs.items():
        if "day" not in values or "night" not in values:
            continue
        day_share = values["day"]
        night_share = values["night"]
        shifts.append(
            {
                "dimension": dimension,
                "category": category,
                "label": f"{dimension}: {category}" if dimension != "Gender" else category,
                "day_share": round(day_share, 4),
                "night_share": round(night_share, 4),
                "delta": round(night_share - day_share, 4),
            }
        )

    shifts.sort(key=lambda item: abs(float(item["delta"])), reverse=True)
    return shifts[:6]


def load_commute_snapshot() -> dict[str, float | str]:
    rows = []
    with (PROCESSED_DIR / "night_commute_structure.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        for row in csv.DictReader(handle):
            if row["time_period"] == "night_time_workers":
                rows.append(row)

    def find(residence: str, workplace: str) -> float:
        for row in rows:
            if row["residence_zone"] == residence and row["workplace_zone"] == workplace:
                return float(row["share"])
        return 0.0

    outer_to_outer = find("Outer London", "Outer London")
    outer_to_inner = find("Outer London", "Inner London")
    inner_to_inner = find("Inner London", "Inner London")

    return {
        "outer_to_outer": round(outer_to_outer, 4),
        "outer_to_inner": round(outer_to_inner, 4),
        "inner_to_inner": round(inner_to_inner, 4),
        "narrative": (
            "Outer-London night work is more likely to stay outer-to-outer, while the "
            "centre still concentrates the strongest night activity footprint."
        ),
    }


def build_inner_outer_summary(
    boroughs: dict[str, dict[str, float | int | str]],
) -> list[dict[str, float | str]]:
    summary = []
    for metric, label in [
        ("activity_footprint", "Night footprint"),
        ("support_coverage", "Support coverage"),
        ("mismatch_hotspots", "Mismatch hotspots"),
    ]:
        inner_values = [
            float(values[metric]) for values in boroughs.values() if values["bucket"] == "Inner"
        ]
        outer_values = [
            float(values[metric]) for values in boroughs.values() if values["bucket"] == "Outer"
        ]
        summary.append(
            {
                "metric": metric,
                "label": label,
                "inner": round(mean(inner_values), 4),
                "outer": round(mean(outer_values), 4),
            }
        )
    return summary


def _eligible_boroughs(
    boroughs: dict[str, dict[str, float | int | str]],
) -> list[tuple[str, dict[str, float | int | str]]]:
    return [
        (name, values)
        for name, values in boroughs.items()
        if int(values["msoa_count"]) >= 5
    ]


def build_highlights(
    boroughs: dict[str, dict[str, float | int | str]],
    audience_shift: list[dict[str, float | str]],
    inner_outer: list[dict[str, float | str]],
) -> list[dict[str, str]]:
    eligible = _eligible_boroughs(boroughs)
    top_activity = max(eligible, key=lambda item: float(item[1]["activity_footprint"]))
    top_support = max(eligible, key=lambda item: float(item[1]["support_coverage"]))
    top_mismatch = max(eligible, key=lambda item: float(item[1]["mismatch_hotspots"]))
    footprint_row = next(item for item in inner_outer if item["metric"] == "activity_footprint")
    mismatch_row = next(item for item in inner_outer if item["metric"] == "mismatch_hotspots")
    top_shift = audience_shift[0]

    return [
        {
            "title": "Widest night footprint",
            "value": top_activity[0],
            "detail": (
                f"{float(top_activity[1]['activity_footprint']) * 100:.0f}% of its MSOAs "
                "still clear the night-activity threshold."
            ),
        },
        {
            "title": "Strongest support coverage",
            "value": top_support[0],
            "detail": (
                f"{float(top_support[1]['support_coverage']) * 100:.0f}% of its MSOAs "
                "retain above-threshold support intensity."
            ),
        },
        {
            "title": "Sharpest mismatch",
            "value": top_mismatch[0],
            "detail": (
                f"{float(top_mismatch[1]['mismatch_hotspots']) * 100:.0f}% of its MSOAs "
                "show activity without comparable support."
            ),
        },
        {
            "title": "Inner vs outer split",
            "value": f"{(float(footprint_row['inner']) - float(footprint_row['outer'])) * 100:+.0f} footprint pts",
            "detail": (
                f"Outer boroughs carry {(float(mismatch_row['outer']) - float(mismatch_row['inner'])) * 100:+.0f} "
                "more mismatch points on average."
            ),
        },
        {
            "title": "Night-user shift",
            "value": str(top_shift["label"]),
            "detail": (
                f"Night bus share shifts {float(top_shift['delta']) * 100:+.0f} percentage points "
                "relative to daytime composition."
            ),
        },
    ]


def main() -> None:
    boroughs = load_borough_metrics()
    audience_shift = load_audience_shift()
    commute_snapshot = load_commute_snapshot()
    inner_outer = build_inner_outer_summary(boroughs)
    highlights = build_highlights(boroughs, audience_shift, inner_outer)

    payload = {
        "layerMeta": LAYER_META,
        "thresholds": THRESHOLDS,
        "boroughs": boroughs,
        "audienceShift": audience_shift,
        "innerOuter": inner_outer,
        "commuteSnapshot": commute_snapshot,
        "highlights": highlights,
        "method": [
            "Main map layers use borough shares of qualifying MSOAs, not simple borough means.",
            "Night footprint counts MSOAs with activity_index >= 0.05; support coverage counts MSOAs with support_index >= 0.12.",
            "Mismatch hotspots count MSOAs where activity_index >= 0.03 but support_index <= 0.09.",
            "Map colours are quantile-scaled across boroughs so non-central variation remains visible.",
        ],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[OK] wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
