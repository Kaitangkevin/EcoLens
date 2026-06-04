from __future__ import annotations

from .models import AirQualityData, FireData, RiskAssessment, RiskFactor, WeatherData


def calculate_risk(
    weather: WeatherData,
    air_quality: AirQualityData,
    fires: FireData,
) -> RiskAssessment:
    score = 0
    factors: list[RiskFactor] = []

    temp = weather.temperature_c
    if temp is not None:
        points = 0
        if temp >= 38:
            points = 25
        elif temp >= 32:
            points = 18
        elif temp >= 27:
            points = 10
        score += points
        factors.append(
            RiskFactor(
                label="Temperature",
                points=points,
                detail=f"{temp:.1f} C",
            )
        )

    humidity = weather.relative_humidity
    if humidity is not None:
        points = 0
        if humidity <= 15:
            points = 25
        elif humidity <= 25:
            points = 18
        elif humidity <= 35:
            points = 10
        score += points
        factors.append(
            RiskFactor(
                label="Humidity",
                points=points,
                detail=f"{humidity:.0f}%",
            )
        )

    wind = weather.wind_speed_kmh
    if wind is not None:
        points = 0
        if wind >= 55:
            points = 25
        elif wind >= 35:
            points = 16
        elif wind >= 20:
            points = 8
        score += points
        factors.append(
            RiskFactor(
                label="Wind",
                points=points,
                detail=f"{wind:.0f} km/h",
            )
        )

    aqi = air_quality.aqi
    if aqi is not None:
        points = 0
        if aqi >= 201:
            points = 30
        elif aqi >= 151:
            points = 24
        elif aqi >= 101:
            points = 16
        elif aqi >= 51:
            points = 8
        score += points
        factors.append(
            RiskFactor(
                label="Air quality",
                points=points,
                detail=f"AQI {aqi}",
            )
        )

    fire_count = fires.count_within_50km
    if fire_count:
        points = min(35, 15 + fire_count * 4)
        score += points
        detail = f"{fire_count} active fire{'s' if fire_count != 1 else ''} within 50 km"
        factors.append(RiskFactor(label="Active fire proximity", points=points, detail=detail))

    score = max(0, min(score, 100))
    if score >= 75:
        level = "Extreme"
        recommendation = (
            "Avoid outdoor exercise, keep windows closed, and monitor local emergency alerts."
        )
    elif score >= 50:
        level = "High"
        recommendation = (
            "Limit prolonged outdoor activity and check local fire or air quality advisories."
        )
    elif score >= 25:
        level = "Moderate"
        recommendation = (
            "Outdoor activity is possible, but sensitive groups should reduce strenuous exposure."
        )
    else:
        level = "Low"
        recommendation = "Conditions look acceptable for normal outdoor activity."

    if not factors:
        factors.append(
            RiskFactor(
                label="Data availability",
                points=0,
                detail="No live environmental signals were available for scoring.",
            )
        )

    return RiskAssessment(
        level=level,
        score=score,
        recommendation=recommendation,
        factors=factors,
    )


def pm25_to_aqi(pm25: float) -> int:
    breakpoints = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= pm25 <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low)
    return 500
