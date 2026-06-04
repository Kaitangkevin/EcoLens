# EcoLens API Usage

EcoLens exposes one main analysis endpoint from the FastAPI backend.

## Base URL

Local development:

```text
http://localhost:8000
```

Production:

```text
https://your-render-or-railway-service.example.com
```

## Health Check

```bash
curl http://localhost:8000/health
```

Response:

```json
{
  "status": "ok"
}
```

## Analyze Location

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"San Francisco, CA"}'
```

You can pass any of these:

- City: `{"query":"Los Angeles, CA"}`
- US ZIP Code: `{"query":"94103"}`
- Coordinates: `{"query":"37.7749,-122.4194"}`
- Explicit coordinates: `{"latitude":37.7749,"longitude":-122.4194}`

Response fields:

- `location`: resolved name and coordinates
- `weather`: NWS weather grid values and forecast phrase
- `air_quality`: OpenAQ PM2.5 and estimated US AQI
- `fires`: NASA FIRMS active fire detections within 50 km
- `risk`: rule-based score, level, recommendation, and factor details
- `report_markdown`: export-ready Markdown report

## External APIs

Geocoding helpers:

- City names are resolved with Open-Meteo Geocoding.
- US ZIP Codes are resolved with Zippopotam.
- Explicit latitude/longitude inputs skip geocoding.

NOAA / National Weather Service:

- Uses `https://api.weather.gov/points/{lat},{lon}`
- Reads `forecastGridData` for temperature, relative humidity, wind speed, and update time.
- NWS grid data is US-focused.

OpenAQ:

- Uses OpenAQ API v3.
- Requires `OPENAQ_API_KEY` in `.env`.
- EcoLens reads nearby latest PM2.5 from `/v3/parameters/2/latest`.
- OpenAQ point-radius search supports a maximum radius of 25 km.

NASA FIRMS:

- Requires `NASA_FIRMS_MAP_KEY` in `.env`.
- Uses FIRMS Area CSV API:

```text
https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/1
```

- EcoLens filters returned detections to 50 km from the selected point.

## Risk Rules

The MVP score is intentionally simple:

- Higher temperature increases risk.
- Lower humidity increases risk.
- Higher wind speed increases risk.
- Higher AQI increases health risk.
- Active fires within 50 km increase wildfire risk.

Scores map to:

- `Low`: 0-24
- `Moderate`: 25-49
- `High`: 50-74
- `Extreme`: 75-100
