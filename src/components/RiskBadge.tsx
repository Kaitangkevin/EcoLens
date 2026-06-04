import type { RiskLevel } from "../lib/types";

const styles: Record<RiskLevel, string> = {
  Low: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Moderate: "bg-amber-100 text-amber-800 ring-amber-200",
  High: "bg-orange-100 text-orange-800 ring-orange-200",
  Extreme: "bg-red-100 text-red-800 ring-red-200",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ring-1 ${styles[level]}`}>
      {level}
    </span>
  );
}
