import { Download, FileDown } from "lucide-react";
import { downloadMarkdown, downloadPdf } from "../lib/exportReport";
import type { AnalysisResponse } from "../lib/types";

export function ReportPanel({ result }: { result: AnalysisResponse }) {
  return (
    <section id="report" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-ink">Report</h2>
          <p className="mt-1 text-sm text-slate-600">Exportable Markdown or PDF summary.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadMarkdown(result.report_markdown)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Markdown
          </button>
          <button
            type="button"
            onClick={() => downloadPdf(result.report_markdown)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <pre className="mt-5 max-h-[520px] overflow-auto rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
        {result.report_markdown}
      </pre>
    </section>
  );
}
