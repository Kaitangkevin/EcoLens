import { Flame, Gauge, ThermometerSun, Wind } from "lucide-react";
import { formatDate, formatNumber } from "../lib/format";
import type { AnalysisResponse } from "../lib/types";
import { DataCard } from "./DataCard";
import { RiskBadge } from "./RiskBadge";

export function Dashboard({ result }: { result: AnalysisResponse }) {
  const weatherCaption =
    result.weather.status === "ok"
      ? `${result.weather.short_forecast ?? "Current conditions"} · ${formatDate(result.weather.observed_at)}`
      : result.weather.message ?? "Weather unavailable";
  const airCaption =
    result.air_quality.status === "ok"
      ? `PM2.5 ${formatNumber(result.air_quality.pm25, ` ${result.air_quality.unit}`)} · ${formatNumber(
          result.air_quality.distance_km,
          " km away",
        )}`
      : result.air_quality.message ?? "Air quality unavailable";
  const fireCaption =
    result.fires.status === "ok"
      ? result.fires.nearest_distance_km === null
        ? "No active fire detections within 50 km"
        : `Nearest detection ${result.fires.nearest_distance_km} km away`
      : result.fires.message ?? "Fire data unavailable";

  return (
    <section id="dashboard" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{result.location.label}</p>
          <h2 className="mt-1 text-3xl font-semibold text-ink">Dashboard</h2>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <RiskBadge level={result.risk.level} />
            <span className="text-2xl font-semibold text-ink">{result.risk.score}/100</span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-slate-600">{result.risk.recommendation}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DataCard
          title="Weather"
          icon={<ThermometerSun className="h-5 w-5" />}
          value={formatNumber(result.weather.temperature_c, " C")}
          caption={weatherCaption}
          status={result.weather.status}
        />
        <DataCard
          title="Wind & Humidity"
          icon={<Wind className="h-5 w-5" />}
          value={`${formatNumber(result.weather.wind_speed_kmh, " km/h")} · ${formatNumber(
            result.weather.relative_humidity,
            "%",
          )}`}
          caption="Risk rises with dry, windy conditions"
          status={result.weather.status}
        />
        <DataCard
          title="Air Quality"
          icon={<Gauge className="h-5 w-5" />}
          value={result.air_quality.aqi === null ? "Unavailable" : `AQI ${result.air_quality.aqi}`}
          caption={airCaption}
          status={result.air_quality.status}
        />
        <DataCard
          title="Active Fires"
          icon={<Flame className="h-5 w-5" />}
          value={`${result.fires.count_within_50km} within 50 km`}
          caption={fireCaption}
          status={result.fires.status}
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-ink">Risk factors</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {result.risk.factors.map((factor) => (
            <div key={`${factor.label}-${factor.detail}`} className="rounded-md bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-ink">{factor.label}</p>
                <p className="font-semibold text-canopy">+{factor.points}</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">{factor.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
