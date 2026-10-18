import type { SpotFlowMetrics, SpotTrade, SpotDeltaBucket,SpotFlowSummary } from "./types";

type BinanceAggTrade = {
  a: number;  // aggregate trade ID
  p: string;  // price
  q: string;  // quantity
  f: number;  // first trade ID
  l: number;  // last trade ID
  T: number;  // timestamp
  m: boolean; // buyer is maker
  M: boolean; // best price match
};

export function parseAggTrade(raw: BinanceAggTrade): SpotTrade {
  return {
    price: Number(raw.p),
    quantity: Number(raw.q),
    timestamp: raw.T,
    side: raw.m ? "SELL" : "BUY",

  };
}

export async function fetchAggRawTrade(symbol = "BTCUSDT",limit = 500): Promise<BinanceAggTrade[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/aggTrades?symbol=${symbol}&limit=${limit}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Agg Trade fetch failed: ${response.status}`
      );
    }

    const data: BinanceAggTrade[] = await response.json();


    return data;
  } catch (error) {
    console.error("Error fetching agg trade:", error);
    return [];
  }
}
/////////////////////////////////////////////////////////////
export async function fetchAggTradesByTime(
  symbol = "BTCUSDT",
  minutes = 5
): Promise<BinanceAggTrade[]> {
  try {
    const endTime = Date.now();
    const startTime = endTime - minutes * 60_000;

    const response = await fetch(
      `https://api.binance.com/api/v3/aggTrades?symbol=${symbol}&startTime=${startTime}&endTime=${endTime}&limit=1000`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Agg Trades fetch failed: ${response.status}`);
    }

    const data: BinanceAggTrade[] = await response.json();

    return data;
  } catch (error) {
    console.error("[Spot Flow] timed aggTrades fetch failed:", error);
    return [];
  }
}


export function calculateSpotFlowMetrics(
  trades: SpotTrade[]
): SpotFlowMetrics {
  const buyTrades = trades.filter((trade) => trade.side === "BUY");
  const sellTrades = trades.filter((trade) => trade.side === "SELL");

  const buyerVolume = buyTrades.reduce(
    (total, trade) => total + trade.quantity,
    0
  );

  const sellerVolume = sellTrades.reduce(
    (total, trade) => total + trade.quantity,
    0
  );

  const delta = buyerVolume - sellerVolume;

  return {
    buyerVolume,
    sellerVolume,
    delta,
  };
}

export function groupTradesByMinute(
  trades: SpotTrade[]
): Map<number, SpotTrade[]> {
  const buckets = new Map<number, SpotTrade[]>();

  for (const trade of trades) {
    const bucketTimestamp =
      Math.floor(trade.timestamp / 60_000) * 60_000;

    const existingTrades = buckets.get(bucketTimestamp) ?? [];

    existingTrades.push(trade);

    buckets.set(bucketTimestamp, existingTrades);
  }

  return buckets;
}

export function calculateBucketMetrics(
  buckets: Map<number, SpotTrade[]>
) {
  for (const [timestamp, trades] of buckets) {
    const metrics = calculateSpotFlowMetrics(trades);

    console.log("[Bucket Metrics]", {
      timestamp: new Date(timestamp).toISOString(),
      trades: trades.length,
      ...metrics,
    });
  }
}

export function round(value: number, decimals = 5): number {
  return Number(value.toFixed(decimals));
}


export function calcCVDbukets(buckets: Map<number, SpotTrade[]>): SpotDeltaBucket[] {
    let cvd = 0;

    const results: SpotDeltaBucket[] = [];

    const sortedBuckets = Array.from(buckets).sort((a, b) => a[0] - b[0]);

    for(const [timestamp, trades] of sortedBuckets) {

        const metrics = calculateSpotFlowMetrics(trades);

        cvd += metrics.delta;

      results.push({
         timestamp,
         buyerVolume: round(metrics.buyerVolume),
         sellerVolume: round(metrics.sellerVolume),
         delta: round(metrics.delta),
         cvd: round(cvd),
        });
    }
      return results;

}

export async function fetchAggTradesFromId(
  symbol: string,
  fromId: number
): Promise<BinanceAggTrade[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/aggTrades?symbol=${symbol}&fromId=${fromId}&limit=1000`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Agg Trades fetch failed: ${response.status}`);
    }

    const data: BinanceAggTrade[] = await response.json();

    return data;
  } catch (error) {
    console.error("[Spot Flow] fromId fetch failed:", error);
    return [];
  }
}

export async function fetchAggTradesWindow(
  symbol = "BTCUSDT",
  minutes = 5
): Promise<BinanceAggTrade[]> {
  //const endTime = Date.now();
  const endTime = Math.floor(Date.now() / 60_000) * 60_000;
  const startTime = endTime - minutes * 60_000;

  const allTrades: BinanceAggTrade[] = [];

  let batch = await fetchAggTradesByTime(symbol, minutes);

  allTrades.push(...batch);

  while (batch.length === 1000) {
    const lastTrade = batch[batch.length - 1];

    // Elértük az eredeti időablak végét
    if (lastTrade.T >= endTime) {
      break;
    }

    batch = await fetchAggTradesFromId(
      symbol,
      lastTrade.a + 1
    );

    allTrades.push(...batch);
  }

  // A fromId kérés már túlfuthat az endTime-on,
  // ezért csak az eredeti 5 perces window trade-jei maradjanak.
  return allTrades.filter(
    (trade) => trade.T >= startTime && trade.T < endTime
  );
}

export function calculateSpotFlowSummary(
  buckets: SpotDeltaBucket[]
): SpotFlowSummary {
  const totalBuyerVolume = buckets.reduce((acc,bucket) => acc += bucket.buyerVolume,0 );
  const totalSellerVolume = buckets.reduce((acc, bucket)=> acc + bucket.sellerVolume,0);
  const totalVolume = totalBuyerVolume + totalSellerVolume;
  const buyRatio = totalVolume === 0 ? 0 : totalBuyerVolume / totalVolume;
  const netDelta = totalBuyerVolume - totalSellerVolume;

  return {
          totalBuyerVolume: round(totalBuyerVolume),
          totalSellerVolume:round(totalSellerVolume),
          netDelta: round(netDelta),
          buyRatio: round(buyRatio),
       }
}

export async function fetchSpotFlowData(
  symbol = "BTCUSDT",
  minutes = 5
): Promise<SpotFlowSummary> {

   const rawTrades = await fetchAggTradesWindow(symbol, minutes);
   const spotTrades =  rawTrades.map(parseAggTrade);

   const buckets = groupTradesByMinute(spotTrades);

   const cvdBuckets = calcCVDbukets(buckets);

   const spotFlowSummary = calculateSpotFlowSummary(cvdBuckets);


   return spotFlowSummary;

}

console.log("[spot-flow module] loaded");