import type { CatalystPriority } from "./types";

export function getCatalystPriority(
  score: number
): CatalystPriority {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";

  return "LOW";
}