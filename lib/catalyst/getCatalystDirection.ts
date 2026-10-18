import type { CatalystDirection } from "./types";

export function getCatalystDirection(
  sentimentScore: number
): CatalystDirection {
  if (sentimentScore >= 20) {
    return "BULLISH";
  }

  if (sentimentScore <= -20) {
    return "BEARISH";
  }

  return "NEUTRAL";
}