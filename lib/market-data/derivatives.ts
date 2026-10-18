import type { DerivativesRawData, OpenInterestHistoryPoint,PriceHistoryPoint } from "./types";

export async function fetchDerivativesData(
  symbol = "BTCUSDT",
  period = "15m"
): Promise<DerivativesRawData> {
  const [openInterest, fundingRate, longShortRatio] = await Promise.all([
    fetchOpenInterest(symbol),
    fetchFundingRate(symbol),
    fetchGlobalLongShortRatio(symbol, period),
  ]);

  return {
    symbol,
    openInterest,
    fundingRate,
    longShortRatio,
    timestamp: Date.now(),
  };
}

export async function fetchOpenInterest(
  symbol = "BTCUSDT"
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Open Interest fetch failed: ${response.status}`
      );
    }

    const data = await response.json();



    const openInterest = Number(data.openInterest);

    if (!Number.isFinite(openInterest)) {
      return null;
    }

    return openInterest;
  } catch (error) {
    console.error(
      "[Derivatives] Open Interest fetch error:",
      error
    );

    return null;
  }
}

export async function fetchFundingRate(
  symbol = "BTCUSDT"
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Funding Rate fetch failed: ${response.status}`
      );
    }

    const data = await response.json();

    const fundingRate = Number(data.lastFundingRate);

    if (!Number.isFinite(fundingRate)) {
      return null;
    }

    return fundingRate;
  } catch (error) {
    console.error(
      "[Derivatives] Funding Rate fetch error:",
      error
    );

    return null;
  }
}

export async function fetchGlobalLongShortRatio(
  symbol = "BTCUSDT",
  period = "15m"
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Long/Short Ratio fetch failed: ${response.status}`
      );
    }

    const data = await response.json();

    const ratio = Number(data?.[0]?.longShortRatio);

    if (!Number.isFinite(ratio)) {
      return null;
    }

    return ratio;
  } catch (error) {
    console.error(
      "[Derivatives] Long/Short Ratio fetch error:",
      error
    );

    return null;
  }
}
///////////////////////////////////oi history and price history fetchers///////////////
export async function fetchOpenInterestHistory(
  symbol = "BTCUSDT",
  period = "15m"
) : Promise<OpenInterestHistoryPoint[]> {
  const url =
    `https://fapi.binance.com/futures/data/openInterestHist` +
    `?symbol=${symbol}&period=${period}&limit=2`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OI history: ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data) || !data.every(isBinanceOpenInterestHistItem)) {
    throw new Error("Unexpected OI history response shape");
  }

  const history: OpenInterestHistoryPoint[] = data.map((item) => ({
    openInterest: Number(item.sumOpenInterest),
    timestamp: item.timestamp,
  }));

  return history;
}

type BinanceOpenInterestHistItem = {
  sumOpenInterest: string | number;
  timestamp: number;
};

function isBinanceOpenInterestHistItem(
  value: unknown
): value is BinanceOpenInterestHistItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    (typeof item.sumOpenInterest === "string" ||
      typeof item.sumOpenInterest === "number") &&
    typeof item.timestamp === "number"
  );
}

// Binance kline tuple: [openTime, open, high, low, close, ...]
type BinanceKline = [number, ...(string | number)[]];

function isBinanceKline(value: unknown): value is BinanceKline {
  return (
    Array.isArray(value) &&
    typeof value[0] === "number" &&
    (typeof value[4] === "string" || typeof value[4] === "number")
  );
}

//////////////////////////////////////////////////////////
export async function fetchPriceHistory(
  symbol = "BTCUSDT",
  interval = "15m"
): Promise<PriceHistoryPoint[]> {
  const url =
    `https://fapi.binance.com/fapi/v1/klines` +
    `?symbol=${symbol}&interval=${interval}&limit=3`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch price history: ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data) || !data.every(isBinanceKline)) {
    throw new Error("Unexpected klines response shape");
  }

  const closedCandles = data.slice(0, -1);

const history: PriceHistoryPoint[] = closedCandles.map((candle) => ({
  price: Number(candle[4]),
  timestamp: candle[0],
}));

return history;
}