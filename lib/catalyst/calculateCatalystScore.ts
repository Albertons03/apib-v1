
import type { HeadlineSentimentItem } from "@/lib/sentiment/types";

//  const impactWeight = {

//   LOW: 0.5,

//   MEDIUM: 0.75,

//   HIGH: 1,

// } as const;


// export function calculateCatalystScore(

//   item: HeadlineSentimentItem

// ): number {

//   if (item.isDuplicate) {

//     return 0;

//   }


//   const relevanceWeight = item.btcRelevance / 10;

//   const confidenceWeight = item.confidence / 100;

//   const sentimentStrength = Math.abs(item.sentimentScore) / 100;

//   const impact = impactWeight[item.impact];


//   const score =

//     relevanceWeight *

//     confidenceWeight *

//     sentimentStrength *

//     impact *

//     100;


//   return Math.round(

//     Math.max(0, Math.min(100, score))

//   );

//}

const WEIGHTS = {
  RELEVANCE: 0.35,
  SENTIMENT: 0.30,
  CONFIDENCE: 0.20,
  IMPACT: 0.15,
} as const;

const IMPACT_SCORE = {
  LOW: 40,
  MEDIUM: 70,
  HIGH: 100,
} as const;

export function calculateCatalystScore(
  item: HeadlineSentimentItem
): number {
  if (item.isDuplicate) {
    return 0;
  }

  const relevanceNormalized =
    Math.min(10, Math.max(0, item.btcRelevance)) * 10;

  const confidenceNormalized =
    Math.min(100, Math.max(0, item.confidence));

  const sentimentStrength =
    Math.min(100, Math.abs(item.sentimentScore));

  const impactNormalized =
    IMPACT_SCORE[item.impact];

  const score =
    relevanceNormalized * WEIGHTS.RELEVANCE +
    sentimentStrength * WEIGHTS.SENTIMENT +
    confidenceNormalized * WEIGHTS.CONFIDENCE +
    impactNormalized * WEIGHTS.IMPACT;

  return Math.round(
    Math.max(0, Math.min(100, score))
  );
}