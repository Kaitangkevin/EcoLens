import type { AnalysisResponse } from "./types";
import { buildDemoAnalysis } from "./demo";

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.PROD ? "" : "http://localhost:8000");

export async function analyzeLocation(query: string): Promise<AnalysisResponse> {
  if (!API_BASE_URL) {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return buildDemoAnalysis(query);
  }

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
