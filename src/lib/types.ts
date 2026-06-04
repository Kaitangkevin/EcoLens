export type RiskLevel = "Low" | "Moderate" | "High" | "Extreme";

export interface Location {
  label: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  status: "ok" | "unavailable";
  temperature_c: number | null;
  relative_humidity: number | null;
  wind_speed_kmh: number | null;
  short_forecast: string | null;
  observed_at: string | null;
  source: string;
  message: string | null;
}

export interface AirQualityData {
  status: "ok" | "unavailable";
  aqi: number | null;
  pm25: number | null;
  unit: string;
  location_name: string | null;
  observed_at: string | null;
  distance_km: number | null;
  source: string;
  message: string | null;
}

export interface FirePoint {
  latitude: number;
  longitude: number;
  distance_km: number;
  confidence: string | null;
  frp: number | null;
  acquired_at: string | null;
  satellite: string | null;
}

export interface FireData {
  status: "ok" | "unavailable";
  count_within_50km: number;
  nearest_distance_km: number | null;
  fires: FirePoint[];
  source: string;
  message: string | null;
}

export interface RiskFactor {
  label: string;
  points: number;
  detail: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  recommendation: string;
  factors: RiskFactor[];
}

export interface AnalysisResponse {
  location: Location;
  weather: WeatherData;
  air_quality: AirQualityData;
  fires: FireData;
  risk: RiskAssessment;
  report_markdown: string;
}
