from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from .config import get_settings
from .models import AnalysisResponse, AnalyzeRequest
from .report import build_markdown_report
from .risk import calculate_risk
from .services import fetch_air_quality, fetch_fires, fetch_weather, geocode_location


settings = get_settings()

app = FastAPI(
    title="EcoLens API",
    description="Environmental risk analysis API using NWS, OpenAQ, and NASA FIRMS.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_origin.split(",")],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(f"{settings.api_prefix}/analyze", response_model=AnalysisResponse)
async def analyze(payload: AnalyzeRequest) -> AnalysisResponse:
    timeout = httpx.Timeout(settings.request_timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        location = await geocode_location(
            payload.query,
            payload.latitude,
            payload.longitude,
            client,
            settings,
        )
        weather = await fetch_weather(location, client, settings)
        air_quality = await fetch_air_quality(location, client, settings)
        fires = await fetch_fires(location, client, settings)

    risk = calculate_risk(weather, air_quality, fires)
    response = AnalysisResponse(
        location=location,
        weather=weather,
        air_quality=air_quality,
        fires=fires,
        risk=risk,
        report_markdown="",
    )
    response.report_markdown = build_markdown_report(response)
    return response
