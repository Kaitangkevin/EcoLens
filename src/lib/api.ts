import type { AnalysisResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function analyzeLocation(query: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const detail =
      typeof errorPayload?.detail === "string"
        ? errorPayload.detail
        : "EcoLens could not analyze this location.";
    throw new Error(detail);
  }

  return response.json();
}
