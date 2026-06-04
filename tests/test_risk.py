from backend.app.models import AirQualityData, FireData, WeatherData
from backend.app.risk import calculate_risk, pm25_to_aqi


def test_pm25_to_aqi_good_range() -> None:
    assert pm25_to_aqi(10.0) == 42


def test_risk_increases_with_heat_wind_air_quality_and_fire() -> None:
    weather = WeatherData(
        status="ok",
        temperature_c=39,
        relative_humidity=12,
        wind_speed_kmh=60,
    )
    air_quality = AirQualityData(status="ok", aqi=180, pm25=100)
    fires = FireData(status="ok", count_within_50km=3, nearest_distance_km=12)

    risk = calculate_risk(weather, air_quality, fires)

    assert risk.level == "Extreme"
    assert risk.score >= 75
    assert "Avoid outdoor exercise" in risk.recommendation
