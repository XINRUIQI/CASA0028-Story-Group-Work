# After Dark: How the Same Journey Changes

> Compare how the same route shifts after dark — in waiting, support, activity, and uncertainty.

A decision-support prototype for CASA0028, exploring how public transport journeys in London change across different departure times at night.

## Project Structure

```
├── frontend/              Next.js + Tailwind CSS + Mapbox GL JS
│   ├── src/app/           4 pages: Landing / Compare / Unpack / Reflection
│   ├── src/components/    Reusable UI components
│   └── src/lib/           API client + shared types
├── backend/               Python FastAPI
│   ├── api/               5 route modules: journey / support / activity / exposure / waiting
│   ├── core/              Config and shared utilities
│   └── main.py            FastAPI app entry point
├── data/
│   ├── raw/               Raw downloaded datasets (git-ignored)
│   ├── processed/         Cleaned GeoJSON / JSON files
│   └── scripts/           ETL pipeline scripts
└── .github/workflows/     GitHub Actions (CI)
```

## Continuous Integration (GitHub Actions)

On every push and pull request to `main` or `master`, [CI](.github/workflows/ci.yml) runs:

- **Frontend:** `npm ci`, `npm run lint`, `npm run build` (Node 20)
- **Backend:** install `backend/requirements.txt`, import `backend.main`, `compileall`

No secrets are required for CI. After pushing this workflow to GitHub, open the repository’s **Actions** tab to see runs.

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and fill in your API keys
cp .env.example .env

# Run the API server
uvicorn backend.main:app --reload --port 8000
```

> Run `uvicorn` from the project root, not from inside `backend/`.

### 2. Data ETL (run once)

```bash
cd data/scripts

# Generate placeholder headway data
python 05_timetable_headway.py

# Fetch OSM data (requires internet, ~5 min)
python 03_osm_support.py

# Process local CSV/Shapefile data (requires downloads in data/raw/)
python 01_bus_stops_shelters.py
python 02_station_facilities.py
python 04_aed_healthcare.py
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## API Keys Required

| Service | Where to get it | Env var |
|---------|----------------|---------|
| TfL Unified API | https://api-portal.tfl.gov.uk/ | `TFL_API_KEY` |
| Mapbox | https://account.mapbox.com/ | `NEXT_PUBLIC_MAPBOX_TOKEN` |

## Pages

1. **Landing** — Journey input + context selection ("Tonight I am...")
2. **Compare** — Side-by-side time-slot comparison with 6 dimensions
3. **Unpack** — Step-by-step segment breakdown with support badges
4. **Reflection** — Critical evaluation: what this prototype helps with, what it cannot know

## Data Sources

MVP (1-8): TfL Unified API, Timetables, Bus Stops, Bus Shelters, Station topology, Bus station toilets, Network Demand

Recommended (9-17): Near-real-time crowding, BUSTO, NUMBAT, Annual Station Counts, PTAL, OSM, Police API, NHS, AED

Optional (18-21): RODS, Night Observatory OD, Night Bus User characteristics, Transport Crime
