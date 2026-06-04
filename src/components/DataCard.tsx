import type { ReactNode } from "react";

interface DataCardProps {
  title: string;
  icon: ReactNode;
  value: string;
  caption: string;
  status?: "ok" | "unavailable";
}

export function DataCard({ title, icon, value, caption, status = "ok" }: DataCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-haze text-canopy">{icon}</div>
      </div>
      <p className="mt-5 text-2xl font-semibold text-ink">{value}</p>
      <p className={`mt-2 text-sm ${status === "ok" ? "text-slate-500" : "text-amber-700"}`}>{caption}</p>
    </article>
  );
}
