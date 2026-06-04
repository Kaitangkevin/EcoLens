import type { AnalysisResponse } from "./types";

export function buildDemoAnalysis(query: string): AnalysisResponse {
  const label = query.trim() || "San Francisco, California, US";
  return {
    location: {
      label: `${label} (GitHub Pages demo)`,
      latitude: 37.77493,
      longitude: -122.41942,
    },
    weather: {
      status: "ok",
      temperature_c: 31.4,
      relative_humidity: 24,
      wind_speed_kmh: 28,
      short_forecast: "Static demo conditions",
      observed_at: new Date().toISOString(),
      source: "Demo data for GitHub Pages",
      message: null,
    },
    air_quality: {
      status: "ok",
      aqi: 86,
      pm25: 28.4,
      unit: "ug/m3",
      location_name: "Demo OpenAQ sensor",
      observed_at: new Date().toISOString(),
      distance_km: 8.6,
      source: "Demo data for GitHub Pages",
      message: null,
    },
    fires: {
      status: "ok",
      count_within_50km: 2,
      nearest_distance_km: 21.8,
      source: "Demo data for GitHub Pages",
      message: null,
      fires: [
        {
          latitude: 37.91,
          longitude: -122.24,
          distance_km: 21.8,
          confidence: "nominal",
          frp: 4.8,
          acquired_at: "Demo timestamp",
          satellite: "VIIRS demo",
        },
        {
          latitude: 37.58,
          longitude: -122.08,
          distance_km: 42.3,
          confidence: "nominal",
          frp: 7.2,
          acquired_at: "Demo timestamp",
          satellite: "VIIRS demo",
        },
      ],
    },
    risk: {
      level: "High",
      score: 58,
      recommendation:
        "GitHub Pages is showing demo data. Deploy the FastAPI backend and set VITE_API_BASE_URL for live analysis.",
      factors: [
        { label: "Temperature", points: 10, detail: "31.4 C" },
        { label: "Humidity", points: 18, detail: "24%" },
        { label: "Wind", points: 8, detail: "28 km/h" },
        { label: "Air quality", points: 8, detail: "AQI 86" },
        { label: "Active fire proximity", points: 14, detail: "2 demo detections within 50 km" },
      ],
    },
    report_markdown: `# EcoLens Environmental Risk Report

## Location

- Name: ${label} (GitHub Pages demo)
- Coordinates: 37.77493, -122.41942

## Current Signals

- Weather: 31.4 C, 24% humidity, 28 km/h wind
- Air Quality: AQI 86, PM2.5 28.4 ug/m3
- Active Fires: 2 demo active fire detections within 50 km

## Risk Assessment

- Level: High
- Score: 58/100
- Recommendation: GitHub Pages is showing demo data. Deploy the FastAPI backend and set VITE_API_BASE_URL for live analysis.

## Data Sources

- Static demo data for GitHub Pages
- Live deployment uses NOAA / National Weather Service API, OpenAQ API, and NASA FIRMS API
`,
  };
}
