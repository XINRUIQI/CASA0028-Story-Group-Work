from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import CORS_ORIGINS
from backend.api import journey, support, activity, exposure, waiting

app = FastAPI(
    title="After Dark API",
    description="Backend API for After Dark — comparing how the same journey changes across time of day.",
    version="0.1.0",
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


@app.get("/")
async def root():
    return {
        "project": "After Dark",
        "description": "How the Same Journey Changes",
        "endpoints": [
            "/journey/plan",
            "/journey/compare",
            "/journey/stoppoint/search",
            "/support/stop",
            "/support/route",
            "/activity/crowding",
            "/activity/stop-activity",
            "/activity/station-activity",
            "/exposure/crime-context",
            "/exposure/lighting",
            "/waiting/burden",
            "/waiting/line-status",
            "/waiting/uncertainty",
        ],
    }
