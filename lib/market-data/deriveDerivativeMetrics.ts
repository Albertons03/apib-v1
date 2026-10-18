
import type { DerivativesRawData, DerivativesMetrics,OpenInterestHistoryPoint, PriceHistoryPoint } from "./types";



export function deriveDerivativesMetrics(
  current: DerivativesRawData,
  oiHistory: OpenInterestHistoryPoint[],
  priceHistory: PriceHistoryPoint[]
): DerivativesMetrics {
  const fundingPercent =
    current.fundingRate !== null ? current.fundingRate * 100 : null;

    const PRICE_THRESHOLD = 0.1;
    const OI_THRESHOLD = 0.1;

  let fundingBias: DerivativesMetrics["fundingBias"] = "NEUTRAL";

  if (current.fundingRate !== null) {
    if (current.fundingRate > 0) {
      fundingBias = "POSITIVE";
    } else if (current.fundingRate < 0) {
      fundingBias = "NEGATIVE";
    }
  }

  let longShortBias: DerivativesMetrics["longShortBias"] = "BALANCED";

  if (current.longShortRatio !== null) {
    if (current.longShortRatio > 1.1) {
      longShortBias = "LONG_HEAVY";
    } else if (current.longShortRatio < 0.9) {
      longShortBias = "SHORT_HEAVY";
    }
  }

  let openInterestChangePercent: number | null = null;

if (oiHistory.length >= 2) {
  const previousOI = oiHistory[0].openInterest;
  const currentOI = oiHistory[1].openInterest;

  if (previousOI !== 0) {
    openInterestChangePercent =
      ((currentOI - previousOI) / previousOI) * 100;
  }
}
 let priceChangePercent: number | null = null;

if (priceHistory.length >= 2) {
  const previousPrice = priceHistory[0].price;
  const currentPrice = priceHistory[1].price;

  if (previousPrice !== 0) {
    priceChangePercent =
      ((currentPrice - previousPrice) / previousPrice) * 100;
  }
}

let positioningState: DerivativesMetrics["positioningState"] = "NEUTRAL";



if (
  priceChangePercent !== null &&
  openInterestChangePercent !== null
) {
  if (
    priceChangePercent > PRICE_THRESHOLD &&
    openInterestChangePercent > OI_THRESHOLD
  ) {
    positioningState = "PRICE_UP_OI_UP";
  } else if (
    priceChangePercent > PRICE_THRESHOLD &&
    openInterestChangePercent < -OI_THRESHOLD
  ) {
    positioningState = "PRICE_UP_OI_DOWN";
  } else if (
    priceChangePercent < -PRICE_THRESHOLD &&
    openInterestChangePercent > OI_THRESHOLD
  ) {
    positioningState = "PRICE_DOWN_OI_UP";
  } else if (
    priceChangePercent < -PRICE_THRESHOLD &&
    openInterestChangePercent < -OI_THRESHOLD
  ) {
    positioningState = "PRICE_DOWN_OI_DOWN";
  }
}

let positioningBias: DerivativesMetrics["positioningBias"] = "NEUTRAL";

if (positioningState === "PRICE_UP_OI_UP") {
  positioningBias = "BULLISH";
} else if (positioningState === "PRICE_UP_OI_DOWN") {
  positioningBias = "WEAK_BULLISH";
} else if (positioningState === "PRICE_DOWN_OI_UP") {
  positioningBias = "BEARISH";
} else if (positioningState === "PRICE_DOWN_OI_DOWN") {
  positioningBias = "WEAK_BEARISH";
}

let crowdingRisk: DerivativesMetrics["crowdingRisk"] = "LOW";

if (
  fundingPercent !== null &&
  current.longShortRatio !== null
) {
  if (
    fundingPercent > 0.01 &&
    current.longShortRatio > 1.8 &&
    openInterestChangePercent !== null &&
    openInterestChangePercent > 0.1
  ) {
    crowdingRisk = "HIGH";
  } else if (
    fundingPercent > 0.005 ||
    current.longShortRatio > 1.5
  ) {
    crowdingRisk = "MEDIUM";
  }
}

let derivativesSignal: DerivativesMetrics["derivativesSignal"] = "NEUTRAL";

if (
  crowdingRisk === "HIGH" &&
  positioningBias !== "NEUTRAL"
) {
  derivativesSignal = "CAUTION";

} else if (
  positioningBias === "BULLISH"
) {
  derivativesSignal = "BULLISH";

} else if (
  positioningBias === "BEARISH"
) {
  derivativesSignal = "BEARISH";
}

let confidence = 40;


if (

derivativesSignal === "BULLISH" ||

derivativesSignal === "BEARISH"

) {

confidence = 70;

} else if (derivativesSignal === "CAUTION") {

confidence = 55;

}


if (crowdingRisk === "HIGH") {
   confidence -= 10;

   }

confidence = Math.max(0, Math.min(100, confidence));

  return {
    fundingPercent,
    fundingBias,
    longShortBias,
    openInterestChangePercent,
    priceChangePercent,
    positioningState,
    positioningBias,
    crowdingRisk,
    derivativesSignal,
    confidence,
  };
}
