#!/usr/bin/env python3
"""Build a static explainability dataset for the fairness page.

This script turns the processed night-time datasets into a compact JSON file
that the Next.js frontend can read directly on static deployments.
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

LAYER_META = {
    "dependence": {
        "label": "Night-time dependence",
        "accent": "var(--accent-blue)",
        "description": "Higher scores indicate places where after-dark activity remains present but baseline support is comparatively thin, so the night network matters more.",
    },
    "burden": {
        "label": "Night burden",
        "accent": "var(--accent-rose)",
        "description": "Higher scores indicate a heavier after-dark burden once limited support and recent supply contraction are combined.",
    },
    "mismatch": {
        "label": "Dependence-support mismatch",
        "accent": "var(--accent-amber)",
        "description": "Higher scores indicate boroughs where late-night dependence is stronger than the support currently on offer.",
    },
}


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def normalize(values_by_key: dict[str, float]) -> dict[str, float]:
    if not values_by_key:
        return {}
    values = list(values_by_key.values())
    low = min(values)
    high = max(values)
    spread = high - low
    if spread == 0:
        return {key: 0.0 for key in values_by_key}
    return {key: (value - low) / spread for key, value in values_by_key.items()}


def extract_borough(msoa_name: str) -> str:
    return msoa_name.rsplit(" ", 1)[0].strip()


def load_borough_metrics() -> dict[str, dict[str, float | str]]:
    support_activity: dict[str, dict[str, list[float]]] = defaultdict(
        lambda: {"support": [], "activity": []}
    )
    with (PROCESSED_DIR / "msoa_night_support_activity.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        for row in csv.DictReader(handle):
            borough = extract_borough(row["msoa_name"])
            support_activity[borough]["support"].append(float(row["support_index"] or 0.0))
            support_activity[borough]["activity"].append(float(row["activity_index"] or 0.0))

    support_avg = {
        borough: mean(values["support"]) for borough, values in support_activity.items()
    }
    activity_avg = {
        borough: mean(values["activity"]) for borough, values in support_activity.items()
    }

    supply_change: dict[str, list[float]] = defaultdict(list)
    with (PROCESSED_DIR / "borough_night_supply_change.csv").open(
        newline="", encoding="utf-8"
    ) as handle:
        for row in csv.DictReader(handle):
            supply_change[row["borough_name"]].append(float(row["pct_change"] or 0.0))

    supply_avg = {borough: mean(values) for borough, values in supply_change.items()}
    boroughs = sorted(set(support_avg) & set(activity_avg) & set(supply_avg))

    support_norm = normalize({borough: support_avg[borough] for borough in boroughs})
    activity_norm = normalize({borough: activity_avg[borough] for borough in boroughs})
    contraction_norm = normalize(
        {borough: max(0.0, -supply_avg[borough]) for borough in boroughs}
    )

    borough_metrics: dict[str, dict[str, float | str]] = {}
    for borough in boroughs:
        dependence = 0.65 * activity_norm[borough] + 0.35 * (1 - support_norm[borough])
        support_score = 0.75 * support_norm[borough] + 0.25 * (1 - contraction_norm[borough])
        burden = 0.55 * dependence + 0.45 * (1 - support_score)
        mismatch = max(0.0, dependence - support_score)

        borough_metrics[borough] = {
            "bucket": "Inner" if borough in INNER_BOROUGHS else "Outer",
            "activity_index": round(activity_avg[borough], 4),
            "support_index": round(support_avg[borough], 4),
            "supply_change": round(supply_avg[borough], 4),
            "dependence": round(dependence, 4),
            "support_score": round(support_score, 4),
            "burden": round(burden, 4),
            "mismatch": round(mismatch, 4),
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
            "At night, outer-London residents are more likely to stay within outer London "
            "than travel into the centre, while inner-London residents still concentrate heavily inward."
        ),
    }


def build_inner_outer_summary(boroughs: dict[str, dict[str, float | str]]) -> list[dict[str, float | str]]:
    summary = []
    for metric in ["dependence", "support_score", "burden", "mismatch"]:
        inner_values = [
            float(values[metric]) for values in boroughs.values() if values["bucket"] == "Inner"
        ]
        outer_values = [
            float(values[metric]) for values in boroughs.values() if values["bucket"] == "Outer"
        ]
        summary.append(
            {
                "metric": metric,
                "label": "Support" if metric == "support_score" else metric.capitalize(),
                "inner": round(mean(inner_values), 4),
                "outer": round(mean(outer_values), 4),
            }
        )
    return summary


def build_highlights(
    boroughs: dict[str, dict[str, float | str]],
    audience_shift: list[dict[str, float | str]],
    inner_outer: list[dict[str, float | str]],
    commute_snapshot: dict[str, float | str],
) -> list[dict[str, str]]:
    top_burden = max(boroughs.items(), key=lambda item: float(item[1]["burden"]))
    top_mismatch = max(boroughs.items(), key=lambda item: float(item[1]["mismatch"]))
    support_row = next(item for item in inner_outer if item["metric"] == "support_score")
    burden_row = next(item for item in inner_outer if item["metric"] == "burden")
    top_shift = audience_shift[0]

    return [
        {
            "title": "Highest night burden",
            "value": top_burden[0],
            "detail": f"Composite burden score {float(top_burden[1]['burden']) * 100:.0f}/100",
        },
        {
            "title": "Largest mismatch",
            "value": top_mismatch[0],
            "detail": f"Dependence exceeds support by {float(top_mismatch[1]['mismatch']) * 100:.0f} points",
        },
        {
            "title": "Outer vs inner",
            "value": f"{(float(burden_row['outer']) - float(burden_row['inner'])) * 100:+.0f} burden pts",
            "detail": f"Outer boroughs also score {(float(support_row['outer']) - float(support_row['inner'])) * 100:+.0f} support pts relative to inner boroughs",
        },
        {
            "title": "Night-user shift",
            "value": str(top_shift["label"]),
            "detail": f"Night share moves {float(top_shift['delta']) * 100:+.0f} percentage points relative to daytime bus use; outer-to-outer night commuting is {float(commute_snapshot['outer_to_outer']) * 100:.0f}%.",
        },
    ]


def main() -> None:
    boroughs = load_borough_metrics()
    audience_shift = load_audience_shift()
    commute_snapshot = load_commute_snapshot()
    inner_outer = build_inner_outer_summary(boroughs)
    highlights = build_highlights(boroughs, audience_shift, inner_outer, commute_snapshot)

    payload = {
        "layerMeta": LAYER_META,
        "boroughs": boroughs,
        "audienceShift": audience_shift,
        "innerOuter": inner_outer,
        "commuteSnapshot": commute_snapshot,
        "highlights": highlights,
        "method": [
            "Dependence combines borough-level night activity with thin baseline support.",
            "Support blends current support intensity with recent borough-level supply change.",
            "Burden and mismatch are comparative indices for explanation, not causal proof.",
        ],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[OK] wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
