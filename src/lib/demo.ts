import type { AnalysisResponse, FireData, RiskAssessment, RiskFactor, WeatherData } from "./types";

interface StaticLocation {
  label: string;
  latitude: number;
  longitude: number;
}

const COORDINATE_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export async function analyzeStaticLocation(query: string): Promise<AnalysisResponse> {
  const location = await geocodeInBrowser(query);
  const weather = await fetchNwsWeather(location);
  const fires = unavailableFires();
  const risk = calculateStaticRisk(weather, fires);
  const result: AnalysisResponse = {
    location,
    weather,
    air_quality: {
      status: "unavailable",
      aqi: null,
      pm25: null,
      unit: "ug/m3",
      location_name: null,
      observed_at: null,
      distance_km: null,
      source: "OpenAQ",
      message:
        "Live PM2.5 and AQI require the FastAPI backend with OPENAQ_API_KEY. GitHub Pages cannot safely store API keys.",
    },
    fires,
    risk,
    report_markdown: "",
  };
  result.report_markdown = buildMarkdownReport(result);
  return result;
}

async function geocodeInBrowser(query: string): Promise<StaticLocation> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Enter a city, ZIP Code, or coordinates.");
  }

  const coordinateMatch = COORDINATE_RE.exec(trimmed);
  if (coordinateMatch) {
    const latitude = Number(coordinateMatch[1]);
    const longitude = Number(coordinateMatch[2]);
    return {
      label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
    };
  }

  if (/^\d{5}$/.test(trimmed)) {
    const response = await fetch(`https://api.zippopotam.us/us/${trimmed}`);
    if (!response.ok) {
      throw new Error(`ZIP Code ${trimmed} was not found.`);
    }
    const data = await response.json();
    const place = data.places?.[0];
    if (!place) {
      throw new Error(`ZIP Code ${trimmed} was not found.`);
    }
    return {
      label: `${place["place name"]}, ${place["state abbreviation"]} ${trimmed}`,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    };
  }

  const candidates = [trimmed];
  if (trimmed.includes(",")) {
    candidates.push(trimmed.split(",", 1)[0].trim());
  }

  for (const candidate of candidates) {
    const params = new URLSearchParams({
      name: candidate,
      count: "1",
      language: "en",
      format: "json",
      countryCode: "US",
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!response.ok) {
      continue;
    }
    const data = await response.json();
    const first = data.results?.[0];
    if (!first) {
      continue;
    }
    const label = [first.name, first.admin1, first.country_code].filter(Boolean).join(", ");
    return {
      label: `${label || trimmed} (GitHub Pages weather mode)`,
      latitude: Number(first.latitude),
      longitude: Number(first.longitude),
    };
  }

  throw new Error(`Could not geocode "${trimmed}". Try a US city, ZIP Code, or coordinates.`);
}

async function fetchNwsWeather(location: StaticLocation): Promise<WeatherData> {
  try {
    const headers = {
      Accept: "application/geo+json",
    };
    const pointResponse = await fetch(
      `https://api.weather.gov/points/${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`,
      { headers },
    );
    if (!pointResponse.ok) {
      return {
        status: "unavailable",
        temperature_c: null,
        relative_humidity: null,
        wind_speed_kmh: null,
        short_forecast: null,
        observed_at: null,
        source: "NOAA / National Weather Service",
        message: "NWS weather is available only for supported US locations.",
      };
    }

    const pointData = await pointResponse.json();
    const gridUrl = pointData.properties?.forecastGridData;
    const forecastUrl = pointData.properties?.forecast;
    let temperature_c: number | null = null;
    let relative_humidity: number | null = null;
    let wind_speed_kmh: number | null = null;
    let short_forecast: string | null = null;
    let observed_at: string | null = null;

    if (gridUrl) {
      const gridResponse = await fetch(gridUrl, { headers });
      if (gridResponse.ok) {
        const gridData = await gridResponse.json();
        const props = gridData.properties ?? {};
        temperature_c = firstNumberGridValue(props.temperature);
        relative_humidity = firstNumberGridValue(props.relativeHumidity);
        wind_speed_kmh = firstNumberGridValue(props.windSpeed);
        observed_at = props.updateTime ?? null;
        const weather = firstArrayGridValue(props.weather);
        if (Array.isArray(weather) && weather[0]?.weather) {
          short_forecast = weather[0].weather;
        }
      }
    }

    if (forecastUrl) {
      const forecastResponse = await fetch(forecastUrl, { headers });
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        const firstPeriod = forecastData.properties?.periods?.[0];
        short_forecast = short_forecast ?? firstPeriod?.shortForecast ?? null;
        if (temperature_c === null && typeof firstPeriod?.temperature === "number") {
          temperature_c = round((firstPeriod.temperature - 32) * (5 / 9), 1);
        }
        if (wind_speed_kmh === null && typeof firstPeriod?.windSpeed === "string") {
          wind_speed_kmh = parseWindKmh(firstPeriod.windSpeed);
        }
      }
    }

    return {
      status: "ok",
      temperature_c: roundOrNull(temperature_c, 1),
      relative_humidity: roundOrNull(relative_humidity, 0),
      wind_speed_kmh: roundOrNull(wind_speed_kmh, 1),
      short_forecast,
      observed_at: observed_at ?? new Date().toISOString(),
      source: "NOAA / National Weather Service",
      message: null,
    };
  } catch (error) {
    return {
      status: "unavailable",
      temperature_c: null,
      relative_humidity: null,
      wind_speed_kmh: null,
      short_forecast: null,
      observed_at: null,
      source: "NOAA / National Weather Service",
      message: error instanceof Error ? error.message : "NWS weather request failed.",
    };
  }
}

function firstNumberGridValue(layer: { values?: Array<{ value?: unknown }> } | null | undefined): number | null {
  const values = layer?.values ?? [];
  for (const item of values) {
    if (typeof item.value === "number") {
      return item.value;
    }
  }
  return null;
}

function firstArrayGridValue(
  layer: { values?: Array<{ value?: Array<{ weather?: string }> }> } | null | undefined,
): Array<{ weather?: string }> | null {
  const values = layer?.values ?? [];
  for (const item of values) {
    if (Array.isArray(item.value)) {
      return item.value;
    }
  }
  return null;
}

function unavailableFires(): FireData {
  return {
    status: "unavailable",
    count_within_50km: 0,
    nearest_distance_km: null,
    fires: [],
    source: "NASA FIRMS",
    message:
      "Live active fire detections require the FastAPI backend with NASA_FIRMS_MAP_KEY. GitHub Pages cannot safely store API keys.",
  };
}

function calculateStaticRisk(weather: WeatherData, fires: FireData): RiskAssessment {
  let score = 0;
  const factors: RiskFactor[] = [];
  const temp = weather.temperature_c;
  if (temp !== null) {
    const points = temp >= 38 ? 25 : temp >= 32 ? 18 : temp >= 27 ? 10 : 0;
    score += points;
    factors.push({ label: "Temperature", points, detail: `${temp.toFixed(1)} C` });
  }

  const humidity = weather.relative_humidity;
  if (humidity !== null) {
    const points = humidity <= 15 ? 25 : humidity <= 25 ? 18 : humidity <= 35 ? 10 : 0;
    score += points;
    factors.push({ label: "Humidity", points, detail: `${humidity.toFixed(0)}%` });
  }

  const wind = weather.wind_speed_kmh;
  if (wind !== null) {
    const points = wind >= 55 ? 25 : wind >= 35 ? 16 : wind >= 20 ? 8 : 0;
    score += points;
    factors.push({ label: "Wind", points, detail: `${wind.toFixed(0)} km/h` });
  }

  if (fires.count_within_50km > 0) {
    const points = Math.min(35, 15 + fires.count_within_50km * 4);
    score += points;
    factors.push({
      label: "Active fire proximity",
      points,
      detail: `${fires.count_within_50km} active fires within 50 km`,
    });
  }

  score = Math.max(0, Math.min(score, 100));
  const level = score >= 75 ? "Extreme" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";
  const recommendation =
    score >= 75
      ? "Avoid outdoor exercise, keep windows closed, and monitor local emergency alerts."
      : score >= 50
        ? "Limit prolonged outdoor activity and check local fire or air quality advisories."
        : score >= 25
          ? "Outdoor activity is possible, but sensitive groups should reduce strenuous exposure."
          : "Conditions look acceptable for normal outdoor activity.";

  if (!factors.length) {
    factors.push({
      label: "Data availability",
      points: 0,
      detail: "No live weather signals were available for scoring.",
    });
  }

  return {
    level,
    score,
    recommendation,
    factors,
  };
}

function buildMarkdownReport(result: AnalysisResponse): string {
  const weather =
    result.weather.status === "ok"
      ? `${result.weather.temperature_c} C, ${result.weather.relative_humidity}% humidity, ${result.weather.wind_speed_kmh} km/h wind`
      : result.weather.message ?? "Weather unavailable";
  const factors = result.risk.factors
    .map((factor) => `- ${factor.label}: +${factor.points} (${factor.detail})`)
    .join("\n");

  return `# EcoLens Environmental Risk Report

## Location

- Name: ${result.location.label}
- Coordinates: ${result.location.latitude.toFixed(5)}, ${result.location.longitude.toFixed(5)}

## Current Signals

- Weather: ${weather}
- Air Quality: ${result.air_quality.message}
- Active Fires: ${result.fires.message}

## Risk Assessment

- Level: ${result.risk.level}
- Score: ${result.risk.score}/100
- Recommendation: ${result.risk.recommendation}

## Scoring Factors

${factors}

## Data Sources

- GitHub Pages weather mode uses browser-side geocoding and NOAA / National Weather Service weather.
- Full live AQI and active fire data require the FastAPI backend.
`;
}

function parseWindKmh(value: string): number | null {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? round(Number(match[1]) * 1.60934, 1) : null;
}

function roundOrNull(value: number | null, digits: number): number | null {
  return typeof value === "number" ? round(value, digits) : null;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
