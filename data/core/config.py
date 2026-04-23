import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── TfL ──────────────────────────────────────────────────────────
TFL_API_KEY = os.getenv("TFL_API_KEY", "")
TFL_BASE_URL = "https://api.tfl.gov.uk"

# ── External APIs ────────────────────────────────────────────────
MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN", "")
POLICE_API_BASE = os.getenv("POLICE_API_BASE", "https://data.police.uk/api")
NHS_API_BASE = "https://api.nhs.uk/service-search"
NHS_API_KEY = os.getenv("NHS_API_KEY", "")

# ── CORS ─────────────────────────────────────────────────────────
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ── Default time slots for comparison ────────────────────────────
DEFAULT_DEPARTURE_TIMES = ["14:00", "19:00", "00:00"]

TIME_BANDS = {
    "am_peak":    (7, 10),
    "inter_peak": (10, 16),
    "pm_peak":    (16, 19),
    "evening":    (19, 22),
    "late_night": (22, 7),   # wraps midnight
}

# ── Buffer distances (meters) ────────────────────────────────────
SUPPORT_BUFFER_METERS = 300
EXPOSURE_BUFFER_METERS = 500
WALKING_SEGMENT_BUFFER_METERS = 200

# ── Overpass (OSM) ───────────────────────────────────────────────
OVERPASS_URLS = [
    "https://overpass.kumi.systems/api/interpreter",
    "http://overpass-api.de/api/interpreter",
]
LONDON_BBOX = "51.28,-0.51,51.69,0.33"

# ── File paths ───────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"


def time_to_band(time_str: str) -> str:
    """Map 'HH:MM' to a named time-band."""
    try:
        hour = int(time_str.split(":")[0])
    except (ValueError, IndexError):
        return "evening"
    if 7 <= hour < 10:
        return "am_peak"
    if 10 <= hour < 16:
        return "inter_peak"
    if 16 <= hour < 19:
        return "pm_peak"
    if 19 <= hour < 22:
        return "evening"
    return "late_night"
