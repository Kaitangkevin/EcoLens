import { Github, Leaf } from "lucide-react";
import { useState } from "react";
import { About } from "./components/About";
import { Dashboard } from "./components/Dashboard";
import { MapView } from "./components/MapView";
import { ReportPanel } from "./components/ReportPanel";
import { SearchPanel } from "./components/SearchPanel";
import { analyzeLocation } from "./lib/api";
import type { AnalysisResponse } from "./lib/types";

function App() {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    if (!query.trim()) {
      setError("Enter a city, ZIP Code, or coordinates.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeLocation(query.trim());
      setResult(analysis);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "EcoLens could not analyze this location.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="inline-flex items-center gap-2 font-semibold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-canopy text-white">
              <Leaf className="h-5 w-5" />
            </span>
            EcoLens
          </a>
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 sm:flex">
            <a className="hover:text-canopy" href="#dashboard">
              Dashboard
            </a>
            <a className="hover:text-canopy" href="#map">
              Map
            </a>
            <a className="hover:text-canopy" href="#report">
              Report
            </a>
            <a className="hover:text-canopy" href="#about">
              About
            </a>
          </nav>
          <a
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            href="https://github.com/"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      <main>
        <SearchPanel loading={loading} onSearch={handleSearch} />

        {error && (
          <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          </div>
        )}

        {result ? (
          <>
            <Dashboard result={result} />
            <MapView result={result} />
            <ReportPanel result={result} />
          </>
        ) : (
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              Run an analysis to populate the dashboard, map, and report.
            </div>
          </section>
        )}
      </main>

      <About />
    </div>
  );
}

export default App;
