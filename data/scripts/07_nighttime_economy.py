"""
ETL Step 7: GLA Night Time Economy by MSOA

Source: London Datastore — "London's Night Time Economy by Borough and MSOA"
  https://data.london.gov.uk/dataset/night-time-economy

Expected input (XLS with multi-row header):
  data/raw/night_time_economy_msoa.xls

Sheet used: "NTE businesses London MSOAs"
  Rows 0-2 are header rows; data starts at row 3.
  Col 0 = area code, Col 1 = area name, Col 2 = NTE category,
  Col 3..19 = year values (2001–2017).

We filter to "Any Night Time Economy category" + MSOA codes (E02*)
and take the latest year (2017, col index 19).

Output:
  data/processed/nighttime_economy_msoa.json
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd

RAW = Path(__file__).resolve().parent.parent / "raw"
OUT = Path(__file__).resolve().parent.parent / "processed"
OUT.mkdir(exist_ok=True)

LATEST_YEAR_COL = 19  # column index for 2017


def process_nte():
    xls_path = RAW / "night_time_economy_msoa.xls"
    csv_path = RAW / "night_time_economy_msoa.csv"

    if xls_path.exists():
        df = pd.read_excel(
            xls_path,
            sheet_name="NTE businesses London MSOAs",
            header=None,
            skiprows=3,
        )
    elif csv_path.exists():
        df = pd.read_csv(csv_path, header=None, skiprows=3, encoding="latin-1")
    else:
        print(f"[SKIP] No NTE file found at {RAW}.")
        with open(OUT / "nighttime_economy_msoa.json", "w") as f:
            json.dump({}, f)
        return

    df.columns = (
        ["area_code", "area_name", "nte_category"]
        + [str(y) for y in range(2001, 2001 + len(df.columns) - 3)]
    )

    # Keep only MSOA rows (E02*) with the aggregate NTE category
    msoa_mask = df["area_code"].astype(str).str.startswith("E02")
    cat_mask = df["nte_category"] == "Any Night Time Economy category"
    filtered = df[msoa_mask & cat_mask].copy()

    # Also get "Total in all sectors" for computing NTE share
    total_mask = df["nte_category"] == "Total in all sectors"
    totals = df[msoa_mask & total_mask][["area_code", "2017"]].copy()
    totals.columns = ["area_code", "total_2017"]
    totals["total_2017"] = pd.to_numeric(totals["total_2017"], errors="coerce").fillna(0)

    result = {}
    for _, row in filtered.iterrows():
        code = str(row["area_code"]).strip()
        name = str(row["area_name"]).strip()
        nte_workplaces = float(pd.to_numeric(row.get("2017", 0), errors="coerce") or 0)

        total_row = totals[totals["area_code"] == code]
        total_wp = float(total_row["total_2017"].values[0]) if len(total_row) else 0
        nte_share = round(nte_workplaces / total_wp, 3) if total_wp > 0 else 0

        result[code] = {
            "name": name,
            "nighttime_workplaces": nte_workplaces,
            "total_workplaces": total_wp,
            "nte_share": nte_share,
        }

    # Percentiles
    shares = sorted(v["nte_share"] for v in result.values())
    for v in result.values():
        idx = np.searchsorted(shares, v["nte_share"])
        v["nte_intensity_percentile"] = round(idx / max(len(shares), 1), 2)

    out_path = OUT / "nighttime_economy_msoa.json"
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"[OK] Wrote NTE data for {len(result)} MSOAs to {out_path}")


if __name__ == "__main__":
    process_nte()
