import os
from dotenv import load_dotenv

load_dotenv()

TFL_API_KEY = os.getenv("TFL_API_KEY", "")
TFL_BASE_URL = "https://api.tfl.gov.uk"
MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN", "")
POLICE_API_BASE = os.getenv("POLICE_API_BASE", "https://data.police.uk/api")

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

DEFAULT_DEPARTURE_TIMES = ["18:00", "21:00", "22:30"]

SUPPORT_BUFFER_METERS = 300
EXPOSURE_BUFFER_METERS = 500
