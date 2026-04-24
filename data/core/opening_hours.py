"""
Lightweight OSM opening_hours parser.

Handles the most common patterns found in London OSM data:
  "24/7"
  "Mo-Fr 08:00-22:00; Sa 09:00-18:00"
  "Mo-Su 06:00-23:00"
  "08:00-22:00"

Full opening_hours spec is extremely complex; this covers ~80 %
of London convenience/pharmacy/café entries and gracefully
returns True (assume open) for unparseable values.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

_DAY_MAP = {
    "Mo": 0, "Tu": 1, "We": 2, "Th": 3,
    "Fr": 4, "Sa": 5, "Su": 6,
}
_DAY_ABBR = list(_DAY_MAP.keys())

_RANGE_RE = re.compile(
    r"(?P<start_day>[A-Z][a-z])(?:-(?P<end_day>[A-Z][a-z]))?"
    r"\s+(?P<start_h>\d{1,2}):(?P<start_m>\d{2})"
    r"-(?P<end_h>\d{1,2}):(?P<end_m>\d{2})"
)

_TIME_ONLY_RE = re.compile(
    r"^(?P<start_h>\d{1,2}):(?P<start_m>\d{2})"
    r"-(?P<end_h>\d{1,2}):(?P<end_m>\d{2})$"
)


def _day_range(start: str, end: str) -> set[int]:
    s = _DAY_MAP.get(start)
    e = _DAY_MAP.get(end)
    if s is None or e is None:
        return set(range(7))
    if s <= e:
        return set(range(s, e + 1))
    return set(range(s, 7)) | set(range(0, e + 1))


def is_open(opening_hours: Optional[str], dt: Optional[datetime] = None) -> bool:
    """
    Return True if the POI is likely open at *dt* given its
    ``opening_hours`` tag value.  When the tag is absent, empty,
    or unparseable we default to True (assume open) to avoid
    silently discarding POIs.
    """
    if not opening_hours:
        return True

    oh = opening_hours.strip()
    if oh in ("24/7", "24/7; 24/7"):
        return True

    if dt is None:
        dt = datetime.now()

    weekday = dt.weekday()  # 0 = Monday
    minutes = dt.hour * 60 + dt.minute

    # "off" / "closed" rules
    if oh.lower() in ("closed", "off"):
        return False

    # Try time-only pattern first (applies to all days)
    m = _TIME_ONLY_RE.match(oh.strip())
    if m:
        start = int(m["start_h"]) * 60 + int(m["start_m"])
        end = int(m["end_h"]) * 60 + int(m["end_m"])
        if end <= start:
            # wraps midnight
            return minutes >= start or minutes < end
        return start <= minutes < end

    # Try day+time ranges separated by ";"
    matched_any_rule = False
    for part in oh.split(";"):
        part = part.strip()
        if not part:
            continue
        rm = _RANGE_RE.search(part)
        if not rm:
            continue
        matched_any_rule = True
        days = _day_range(rm["start_day"], rm.group("end_day") or rm["start_day"])
        if weekday not in days:
            continue
        start = int(rm["start_h"]) * 60 + int(rm["start_m"])
        end = int(rm["end_h"]) * 60 + int(rm["end_m"])
        if end <= start:
            if minutes >= start or minutes < end:
                return True
        elif start <= minutes < end:
            return True

    # If we parsed rules but none matched → closed
    if matched_any_rule:
        return False

    # Unparseable → assume open
    return True
