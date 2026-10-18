import type { MarketDecision } from "@/lib/decision/types";
import type {NewsSentimentResponse} from "@/lib/sentiment";
import type { MarketCatalyst } from "@/lib/catalyst/types";
import type { DerivativesMetrics } from "../market-data/types";

export type BiasResponse = {
  btcPrice: number
  solPrice: number
  headlines: string[]
  macro: string
  technical: string
  sentiment: NewsSentimentResponse | null
  catalysts: MarketCatalyst[]
  decision: MarketDecision | null
  derivatives: DerivativesMetrics | null
}