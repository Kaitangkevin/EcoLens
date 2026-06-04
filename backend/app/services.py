from __future__ import annotations

import csv
import io
import math
import re
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import HTTPException

from .config import Settings
from .models import AirQualityData, FireData, FirePoint, Location, WeatherData
from .risk import pm25_to_aqi


COORDINATE_RE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return radius * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def _first_value(layer: dict[str, Any] | None) -> Any:
    if not layer:
        return None
    values = layer.get("values") or []
    for item in values:
        value = item.get("value")
        if value is not None:
            return value
    return None


async def geocode_location(
    payload_query: str | None,
    latitude: float | None,
    longitude: float | None,
    client: httpx.AsyncClient,
    settings: Settings,
) -> Location:
    if latitude is not None and longitude is not None:
        return Location(label=f"{latitude:.5f}, {longitude:.5f}", latitude=latitude, longitude=longitude)

    query = (payload_query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Provide a city, ZIP Code, or coordinates.")

    coordinate_match = COORDINATE_RE.match(query)
    if coordinate_match:
        lat = float(coordinate_match.group(1))
        lon = float(coordinate_match.group(2))
        return Location(label=query, latitude=lat, longitude=lon)

    if re.fullmatch(r"\d{5}", query):
        response = await client.get(f"https://api.zippopotam.us/us/{query}")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"ZIP Code {query} was not found.")
        response.raise_for_status()
        data = response.json()
        place = data["places"][0]
        label = f"{place['place name']}, {place['state abbreviation']} {query}"
        return Location(
            label=label,
            latitude=float(place["latitude"]),
            longitude=float(place["longitude"]),
        )

    open_meteo_location = await _geocode_with_open_meteo(query, client)
    if open_meteo_location:
        return open_meteo_location

    try:
        response = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": query,
                "format": "json",
                "limit": 1,
                "countrycodes": "us",
                "email": settings.contact_email,
            },
            headers={"User-Agent": settings.user_agent},
        )
        response.raise_for_status()
        data = response.json()
        if data:
            first = data[0]
            return Location(
                label=first.get("display_name", query),
                latitude=float(first["lat"]),
                longitude=float(first["lon"]),
            )
    except httpx.HTTPError:
        pass

    raise HTTPException(status_code=404, detail=f"Could not geocode '{query}'.")


async def _geocode_with_open_meteo(
    query: str,
    client: httpx.AsyncClient,
) -> Location | None:
    candidates = [query]
    if "," in query:
        candidates.append(query.split(",", 1)[0].strip())

    for candidate in candidates:
        response = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={
                "name": candidate,
                "count": 1,
                "language": "en",
                "format": "json",
                "countryCode": "US",
            },
        )
        response.raise_for_status()
        results = response.json().get("results") or []
        if not results:
            continue
        first = results[0]
        label_parts = [
            first.get("name"),
            first.get("admin1"),
            first.get("country_code"),
        ]
        label = ", ".join(str(part) for part in label_parts if part)
        return Location(
            label=label or query,
            latitude=float(first["latitude"]),
            longitude=float(first["longitude"]),
        )

    return None


async def fetch_weather(
    location: Location,
    client: httpx.AsyncClient,
    settings: Settings,
) -> WeatherData:
    headers = {"User-Agent": settings.user_agent, "Accept": "application/geo+json"}
    try:
        points = await client.get(
            f"https://api.weather.gov/points/{location.latitude:.4f},{location.longitude:.4f}",
            headers=headers,
        )
        if points.status_code == 404:
            return WeatherData(
                status="unavailable",
                message="NWS weather data is only available for supported US locations.",
            )
        points.raise_for_status()
        point_props = points.json()["properties"]
        grid_url = point_props.get("forecastGridData")
        forecast_url = point_props.get("forecast")

        temperature_c = humidity = wind_kmh = None
        observed_at = None
        short_forecast = None

        if grid_url:
            grid = await client.get(grid_url, headers=headers)
            grid.raise_for_status()
            props = grid.json()["properties"]
            temperature_c = _first_value(props.get("temperature"))
            humidity = _first_value(props.get("relativeHumidity"))
            wind_kmh = _first_value(props.get("windSpeed"))
            weather_layer = _first_value(props.get("weather"))
            observed_at = props.get("updateTime")
            if weather_layer and isinstance(weather_layer, list) and weather_layer:
                short_forecast = weather_layer[0].get("weather")

        if forecast_url:
            forecast = await client.get(forecast_url, headers=headers)
            forecast.raise_for_status()
            periods = forecast.json().get("properties", {}).get("periods", [])
            if periods:
                first_period = periods[0]
                short_forecast = short_forecast or first_period.get("shortForecast")
                if temperature_c is None and first_period.get("temperature") is not None:
                    temp_f = float(first_period["temperature"])
                    temperature_c = round((temp_f - 32) * 5 / 9, 1)
                if wind_kmh is None:
                    wind_kmh = _parse_wind_speed_kmh(first_period.get("windSpeed"))

        if observed_at is None:
            observed_at = datetime.now(UTC).isoformat()

        return WeatherData(
            status="ok",
            temperature_c=_round_optional(temperature_c, 1),
            relative_humidity=_round_optional(humidity, 0),
            wind_speed_kmh=_round_optional(wind_kmh, 1),
            short_forecast=short_forecast,
            observed_at=observed_at,
        )
    except httpx.HTTPError as exc:
        return WeatherData(status="unavailable", message=f"NWS request failed: {exc}")


def _parse_wind_speed_kmh(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", value)
    if not match:
        return None
    return round(float(match.group(1)) * 1.60934, 1)


def _round_optional(value: Any, digits: int) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


async def fetch_air_quality(
    location: Location,
    client: httpx.AsyncClient,
    settings: Settings,
) -> AirQualityData:
    if not settings.openaq_api_key:
        return AirQualityData(
            status="unavailable",
            message="Set OPENAQ_API_KEY to enable live OpenAQ PM2.5 and AQI data.",
        )

    headers = {"X-API-Key": settings.openaq_api_key, "User-Agent": settings.user_agent}
    params = {
        "coordinates": f"{location.latitude},{location.longitude}",
        "radius": 25000,
        "limit": 20,
    }

    try:
        response = await client.get(
            "https://api.openaq.org/v3/parameters/2/latest",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        results = response.json().get("results", [])
        readings = []
        for item in results:
            coords = item.get("coordinates") or {}
            lat = coords.get("latitude")
            lon = coords.get("longitude")
            value = item.get("value")
            if lat is None or lon is None or value is None:
                continue
            distance = haversine_km(location.latitude, location.longitude, float(lat), float(lon))
            readings.append((distance, item))

        if not readings:
            return AirQualityData(
                status="unavailable",
                message="No nearby OpenAQ PM2.5 sensor was found within 25 km.",
            )

        distance, nearest = min(readings, key=lambda pair: pair[0])
        pm25 = round(float(nearest["value"]), 1)
        datetime_payload = nearest.get("datetime") or {}
        return AirQualityData(
            status="ok",
            aqi=pm25_to_aqi(pm25),
            pm25=pm25,
            location_name=nearest.get("location") or nearest.get("locationsId"),
            observed_at=datetime_payload.get("local") or datetime_payload.get("utc"),
            distance_km=round(distance, 1),
        )
    except httpx.HTTPError as exc:
        return AirQualityData(status="unavailable", message=f"OpenAQ request failed: {exc}")


async def fetch_fires(
    location: Location,
    client: httpx.AsyncClient,
    settings: Settings,
) -> FireData:
    if not settings.nasa_firms_map_key:
        return FireData(
            status="unavailable",
            message="Set NASA_FIRMS_MAP_KEY to enable active fire detections.",
        )

    bbox = _bbox_around(location.latitude, location.longitude, radius_km=50)
    bbox_text = ",".join(f"{value:.4f}" for value in bbox)
    url = (
        "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        f"{settings.nasa_firms_map_key}/{settings.nasa_firms_source}/{bbox_text}/1"
    )

    try:
        response = await client.get(url)
        response.raise_for_status()
        rows = csv.DictReader(io.StringIO(response.text))
        fire_points: list[FirePoint] = []
        for row in rows:
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
            except (KeyError, ValueError):
                continue
            distance = haversine_km(location.latitude, location.longitude, lat, lon)
            if distance > 50:
                continue
            fire_points.append(
                FirePoint(
                    latitude=lat,
                    longitude=lon,
                    distance_km=round(distance, 1),
                    confidence=row.get("confidence"),
                    frp=_safe_float(row.get("frp")),
                    acquired_at=_format_fire_time(row.get("acq_date"), row.get("acq_time")),
                    satellite=row.get("satellite"),
                )
            )
        fire_points.sort(key=lambda point: point.distance_km)
        nearest = fire_points[0].distance_km if fire_points else None
        return FireData(
            status="ok",
            count_within_50km=len(fire_points),
            nearest_distance_km=nearest,
            fires=fire_points[:50],
        )
    except httpx.HTTPError as exc:
        return FireData(status="unavailable", message=f"NASA FIRMS request failed: {exc}")


def _bbox_around(lat: float, lon: float, radius_km: float) -> tuple[float, float, float, float]:
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.1))
    west = max(-180.0, lon - lon_delta)
    south = max(-90.0, lat - lat_delta)
    east = min(180.0, lon + lon_delta)
    north = min(90.0, lat + lat_delta)
    return west, south, east, north


def _safe_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _format_fire_time(date: str | None, time_text: str | None) -> str | None:
    if not date:
        return None
    if not time_text:
        return date
    padded = time_text.zfill(4)
    return f"{date} {padded[:2]}:{padded[2:]} UTC"
