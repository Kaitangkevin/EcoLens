export function About() {
  return (
    <section id="about" className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold text-ink">About EcoLens</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            EcoLens is an MVP environmental risk dashboard for quick local checks. It combines weather,
            air quality, and active fire proximity into a transparent rule-based score.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-ink">Data sources</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>NOAA / National Weather Service for weather and forecast grid data.</li>
            <li>OpenAQ for PM2.5 readings and estimated AQI.</li>
            <li>NASA FIRMS for satellite active fire detections.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-ink">Risk model</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The score increases with heat, low humidity, wind, AQI, and nearby active fire detections.
            It is informational only and should be paired with official local guidance.
          </p>
        </div>
      </div>
    </section>
  );
}
