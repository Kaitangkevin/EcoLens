import { Loader2, LocateFixed, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

interface SearchPanelProps {
  loading: boolean;
  onSearch: (query: string) => void;
}

export function SearchPanel({ loading, onSearch }: SearchPanelProps) {
  const [query, setQuery] = useState("San Francisco, CA");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query);
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      onSearch(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    });
  }

  return (
    <section className="border-b border-slate-200 bg-haze">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-canopy">EcoLens</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Environmental risk analysis for local decisions
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Check weather, PM2.5, active fire proximity, and a simple outdoor risk score for a city,
            ZIP Code, or coordinates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            Location
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="location"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 text-base text-ink outline-none transition focus:border-canopy focus:ring-2 focus:ring-canopy/20"
              placeholder="City, ZIP Code, or lat,lng"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-canopy px-4 font-semibold text-white transition hover:bg-canopy/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analyze
            </button>
          </div>
          <button
            type="button"
            onClick={useBrowserLocation}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <LocateFixed className="h-4 w-4" />
            Use current location
          </button>
        </form>
      </div>
    </section>
  );
}
