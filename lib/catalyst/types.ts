import type {
  HeadlineSentimentItem,
} from "@/lib/sentiment/types";

export type CatalystDirection =
  | "BULLISH"
  | "BEARISH"
  | "NEUTRAL";

export type CatalystPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type MarketCatalyst = {
  headline: string;

  category: HeadlineSentimentItem["category"];

  direction: CatalystDirection;

  priority: CatalystPriority;

  score: number; // 0-100

  timeframe: HeadlineSentimentItem["timeframe"];

  btcRelevance: number;
  sentimentScore: number;
  confidence: number;

  reason: string;
};