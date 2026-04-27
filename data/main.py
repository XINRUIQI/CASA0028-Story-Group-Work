from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from data.core.config import CORS_ORIGINS
from data.api import journey, support, activity, exposure, waiting, recovery, fairness, comparison

app = FastAPI(
    title="After Dark API",
    description=(
        "Backend API for After Dark — comparing how the same journey "
        "changes across time of day in terms of waiting, support, "
        "activity, exposure and recovery."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(journey.router)
app.include_router(support.router)
app.include_router(activity.router)
app.include_router(exposure.router)
app.include_router(waiting.router)
app.include_router(recovery.router)
app.include_router(fairness.router)
app.include_router(comparison.router)


@app.get("/")
async def root():
    return {
        "project": "After Dark",
        "description": "How the Same Journey Changes",
        "version": "0.2.0",
        "endpoint_groups": {
            "journey": [
                "/journey/plan",
                "/journey/compare",
                "/journey/stoppoint/search",
            ],
            "comparison_cards": [
                "/compare/cards",
                "/compare/hourly",
            ],
            "waiting": [
                "/waiting/burden",
                "/waiting/line-status",
                "/waiting/uncertainty",
                "/waiting/arrivals",
            ],
            "support": [
                "/support/stop",
                "/support/route",
                "/support/summary",
            ],
            "activity": [
                "/activity/crowding",
                "/activity/stop-activity",
                "/activity/station-activity",
                "/activity/nighttime-economy",
            ],
            "exposure": [
                "/exposure/crime-context",
                "/exposure/lighting",
                "/exposure/lit-roads",
            ],
            "recovery": [
                "/recovery/missed-connection",
                "/recovery/journey-recovery",
            ],
            "fairness": [
                "/fairness/layers",
                "/fairness/layer/{layer_id}",
                "/fairness/zone/{zone_code}",
                "/fairness/summary",
            ],
        },
    }
