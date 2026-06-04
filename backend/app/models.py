from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["Low", "Moderate", "High", "Extreme"]


class AnalyzeRequest(BaseModel):
    query: str | None = Field(
        default=None,
        description="City name, US ZIP Code, or 'latitude,longitude'.",
    )
    latitude: float | None = None
    longitude: float | None = None


class Location(BaseModel):
    label: str
    latitude: float
    longitude: float


class WeatherData(BaseModel):
    status: Literal["ok", "unavailable"]
    temperature_c: float | None = None
    relative_humidity: float | None = None
    wind_speed_kmh: float | None = None
    short_forecast: str | None = None
    observed_at: str | None = None
    source: str = "NOAA / National Weather Service"
    message: str | None = None


class AirQualityData(BaseModel):
    status: Literal["ok", "unavailable"]
    aqi: int | None = None
    pm25: float | None = None
    unit: str = "ug/m3"
    location_name: str | None = None
    observed_at: str | None = None
    distance_km: float | None = None
    source: str = "OpenAQ"
    message: str | None = None


class FirePoint(BaseModel):
    latitude: float
    longitude: float
    distance_km: float
    confidence: str | None = None
    frp: float | None = None
    acquired_at: str | None = None
    satellite: str | None = None


class FireData(BaseModel):
    status: Literal["ok", "unavailable"]
    count_within_50km: int = 0
    nearest_distance_km: float | None = None
    fires: list[FirePoint] = []
    source: str = "NASA FIRMS"
    message: str | None = None


class RiskFactor(BaseModel):
    label: str
    points: int
    detail: str


class RiskAssessment(BaseModel):
    level: RiskLevel
    score: int
    recommendation: str
    factors: list[RiskFactor]


class AnalysisResponse(BaseModel):
    location: Location
    weather: WeatherData
    air_quality: AirQualityData
    fires: FireData
    risk: RiskAssessment
    report_markdown: str
