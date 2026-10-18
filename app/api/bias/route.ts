

import OpenAI from "openai";
import { fetchAllMarketData, hasValidMarketData } from "@/lib/market-data";
import { calculateTradeQuality } from "@/lib/decision/calculateTradeQuality";
import { parseDecisionResponse } from "@/lib/decision/parseDecision";
import { fetchSpotFlowData } from "@/lib/market-data/spot-flow";
import {
  fetchDerivativesData,
  fetchOpenInterestHistory,
  fetchPriceHistory,
} from "@/lib/market-data/derivatives";
import { deriveDerivativesMetrics } from "@/lib/market-data/deriveDerivativeMetrics";
import type { BiasResponse } from "@/lib/types/bias";
import {
  buildMacroPrompt,
  buildTechnicalPrompt,
  buildSentimentPrompt,
  buildDecisionPrompt,
} from "@/lib/prompts";
import {
  calculateWeightedSentiment,
  getOverallSentimentLabel,
  parseSentimentResponse,
} from "@/lib/sentiment";
import { calculateCatalystScore } from "@/lib/catalyst/calculateCatalystScore";
import { getCatalystDirection } from "@/lib/catalyst/getCatalystDirection";
import type { MarketCatalyst } from "@/lib/catalyst/types";
import { getCatalystPriority } from "@/lib/catalyst/getCatalystPriority";



async function callAgent(openai: OpenAI, prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content ?? "No output";
  } catch (err) {
    console.error("❌ [Bias API] Agent error:", err);
    return "Error";
  }
}

async function callJsonAgent(openai: OpenAI, prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content ?? "{}";
  } catch (error) {
    console.error("❌ [Bias API] JSON agent error:", error);
    return "{}";
  }
}


async function callDecisionAgent(openai: OpenAI, prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content ?? "No decision output";
  } catch (err) {
    console.error("❌ [Bias API] Decision agent error:", err);
    return '{"bias":"NO TRADE","confidence":0,"quality":"C","action":"NO TRADE","entry":0,"stopLoss":0,"target":0,"reason":"AI error - could not generate analysis"}';
  }
}

function createErrorResponse(): BiasResponse {
  return {
    btcPrice: 0,
    solPrice: 0,
    headlines: [],
    macro: "No data",
    technical: "No data",
    sentiment: null,
    catalysts: [],
    decision: null,
    derivatives: null,
  };
}

// =====================================================
// FŐ FÜGGVÉNY: GET /api/bias
// =====================================================



export async function GET(): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[Bias API] OPENAI_API_KEY is not configured");
    return Response.json(createErrorResponse(), { status: 500 });
  }
  const openai = new OpenAI({ apiKey });

  // ── 1. Piaci adatok lekérése ──────────────────────
  // A fetchAllMarketData már kezeli a hibákat:
  //   - Ha CoinGecko hibázik → btcPrice = 0
  //   - Ha Fear&Greed hibázik → value = 0
  //   - Ha RSS hibázik → headlines = placeholder
  const marketData = await fetchAllMarketData();

  // ── 2. Korai kilépés, ha nincs BTC ár ────────────
  // Nincs értelme az AI-t hívni, ha nincs árfolyam adat
  if (!hasValidMarketData(marketData)) {
    return Response.json(createErrorResponse());
  }


  const [macro, technical, sentimentRaw] = await Promise.all([
    callAgent(openai, buildMacroPrompt(marketData)),
    callAgent(openai, buildTechnicalPrompt(marketData)),
    callJsonAgent(openai, buildSentimentPrompt(marketData.headlines)),
  ]);

  const parsedSentiment = parseSentimentResponse(sentimentRaw);


  const derivativesData = await fetchDerivativesData();
  const oiHistory = await fetchOpenInterestHistory();
  const priceHistory = await fetchPriceHistory();

  const derivativesMetrics = deriveDerivativesMetrics(
    derivativesData,
    oiHistory,
    priceHistory,
  );

  console.log("[Derivatives] derived metrics:", derivativesMetrics);


  console.log("fetchSpotFlowData:", fetchSpotFlowData);

  const spotFlow = await fetchSpotFlowData();

  console.log("[Spot Flow] summary:", spotFlow);



  if (!parsedSentiment) {
    console.error(
      "⚠️ Sentiment parse failed; falling back to raw sentiment string.",
    );
  }

  const normalizedSentiment = parsedSentiment
    ? (() => {
        const overallWeightedScore = calculateWeightedSentiment(
          parsedSentiment.items,
        );

        return {
          ...parsedSentiment,
          overallWeightedScore,
          overallSentiment: getOverallSentimentLabel(overallWeightedScore),
          confidence: Math.round(parsedSentiment.confidence),
        };
      })()
    : null;

  console.log("[Bias API] normalized sentiment:", normalizedSentiment);

  const catalysts: MarketCatalyst[] = normalizedSentiment
    ? normalizedSentiment.items
        .filter((item) => !item.isDuplicate)
        .map((item): MarketCatalyst => {
          const score = calculateCatalystScore(item);

          return {
            headline: item.headline,
            category: item.category,
            direction: getCatalystDirection(item.sentimentScore),
            priority: getCatalystPriority(score),
            score,
            timeframe: item.timeframe,
            btcRelevance: item.btcRelevance,
            sentimentScore: item.sentimentScore,
            confidence: item.confidence,
            reason: item.reasoning,
          };
        })
        .sort((a, b) => b.score - a.score)
    : [];

  const topCatalysts = catalysts.slice(0, 5);

  console.log("[Bias API] top catalysts:", topCatalysts);

  //console.log("[Bias API] sorted catalysts:", catalysts);

  const sentimentForPrompt = normalizedSentiment
    ? JSON.stringify(normalizedSentiment)
    : sentimentRaw;

  // ── 4. Döntéshozó AI meghívása ──────────────────
  // Összegzi a 3 elemzést és hozza meg a végső döntést
  const decision = await callDecisionAgent(
    openai,
    buildDecisionPrompt(
      marketData,
      macro,
      technical,
      sentimentForPrompt,
      derivativesMetrics,
    ),
  );

  console.log("[Bias API] raw decision:", decision);

  const parsedDecision = parseDecisionResponse(decision);

  console.log("[Bias API] parsed decision:", parsedDecision);

  if (parsedDecision) {
    const llmTradeQuality = parsedDecision.tradeQuality;

    const calculatedTradeQuality = calculateTradeQuality(
      parsedDecision.confidence,
      parsedDecision.action,
    );

    console.log({
      llmTradeQuality,
      calculatedTradeQuality,
    });
  }

  // ── 5. Válasz összeállítása ──────────────────────
  // A típus (BiasResponse) garantálja, hogy nem hagytunk ki
  // mezőt és nem gépeltünk el semmit.
  return Response.json({
    btcPrice: marketData.btcPrice,
    solPrice: marketData.solPrice,
    headlines: marketData.headlines,
    macro,
    technical,
    sentiment: normalizedSentiment,
    catalysts: topCatalysts,
    derivatives: derivativesMetrics,
    decision: parsedDecision,
  } satisfies BiasResponse);
}
