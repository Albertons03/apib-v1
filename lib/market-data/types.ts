export type DerivativesRawData = {
  symbol: string;
  openInterest: number | null;
  fundingRate: number | null;
  longShortRatio: number | null;
  timestamp: number;
};



export type DerivativesMetrics = {
  fundingPercent: number | null;
  fundingBias: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  longShortBias: "LONG_HEAVY" | "BALANCED" | "SHORT_HEAVY";

  priceChangePercent: number | null;
  openInterestChangePercent: number | null;

  confidence: number;

  positioningBias:
  | "BULLISH"
  | "WEAK_BULLISH"
  | "NEUTRAL"
  | "WEAK_BEARISH"
  | "BEARISH";

  crowdingRisk: "LOW" | "MEDIUM" | "HIGH";

  positioningState:
    | "PRICE_UP_OI_UP"
    | "PRICE_UP_OI_DOWN"
    | "PRICE_DOWN_OI_UP"
    | "PRICE_DOWN_OI_DOWN"
    | "NEUTRAL";

    derivativesSignal:
  | "BULLISH"
  | "BEARISH"
  | "CAUTION"
  | "NEUTRAL";
};



export type OpenInterestHistoryPoint = {
  openInterest: number;
  timestamp: number;
};
export type PriceHistoryPoint = {
  price: number;
  timestamp: number;
};
export type SpotTrade = {
  price: number;
  quantity: number;
  timestamp: number;
  side: "BUY" | "SELL";
};

export type SpotFlowMetrics = {
  buyerVolume: number;
  sellerVolume: number;
  delta: number;
};

export type SpotDeltaBucket = {
  timestamp: number;
  buyerVolume: number;
  sellerVolume: number;
  delta: number;
  cvd: number;
};

export type SpotFlowResponse = {
  tradeCount: number;
  bucketCount: number;
  cvdBuckets: SpotDeltaBucket[];
};

export type SpotFlowSummary = {
  totalBuyerVolume: number;
  totalSellerVolume: number;
  netDelta: number;
  buyRatio: number;
};