import type {NewsSentimentResponse} from "@/lib/sentiment/types";
import type { MarketCatalyst } from "@/lib/catalyst/types";
import { CatalystList } from "./CatalystList";

interface SentimentAgentCardProps {
  title: string;
  icon: string;
  content: NewsSentimentResponse | null;
  catalysts: MarketCatalyst[];
}

export function SentimentAgentCard({ title, icon, content, catalysts }: SentimentAgentCardProps) {

  const sentimentColor =
  content?.overallSentiment === "STRONGLY_BULLISH" ||
  content?.overallSentiment === "BULLISH" ||
  content?.overallSentiment === "SLIGHTLY_BULLISH"
    ? "text-green-400"
    : content?.overallSentiment === "STRONGLY_BEARISH" ||
      content?.overallSentiment === "BEARISH" ||
      content?.overallSentiment === "SLIGHTLY_BEARISH"
    ? "text-red-400"
    : "text-gray-400";

    if (!content) {
      return (
        <div className="bg-gray-900 p-4 rounded-xl">
          <h3 className="mb-2">{icon} {title}</h3>
          <p className="text-sm text-gray-400">
            Loading sentiment...
          </p>
        </div>
      );
    }

  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <h3 className="mb-2">{icon} {title}</h3>
      {content ? (
  <div className="mb-4 space-y-2">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-400">
        Overall Sentiment
      </span>

      <span className={`text-sm font-bold ${sentimentColor}`}>
        {content.overallSentiment}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-400">
        Weighted Score
      </span>

      <span className="font-semibold">
        {content.overallWeightedScore > 0 ? "+" : ""}
        {content.overallWeightedScore}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-400">
        Confidence
      </span>

      <span className="font-semibold">
        {content.confidence}%
      </span>
    </div>
  </div>
) : (
  <p className="text-sm text-gray-400">
    Loading sentiment...
  </p>
)}
      <div className="mb-4 grid grid-cols-1 gap-3">
  <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
    <p className="text-xs text-gray-400">
      Intraday Bias
    </p>
    <p className="mt-1 text-sm">
      {content.intradayBias}
    </p>
  </div>

  <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
    <p className="text-xs text-gray-400">
      Short-Term Bias
    </p>
    <p className="mt-1 text-sm">
      {content.shortTermBias}
    </p>
  </div>
</div>
      <CatalystList catalysts={catalysts} />

      <div className="mt-4 grid grid-cols-1 gap-3">
  <div className="rounded-lg border border-green-800 bg-green-950 p-3">
    <p className="text-xs font-semibold text-green-400">
      🟢 Strongest Bullish Catalyst
    </p>

    <p className="mt-1 text-sm">
      {content.strongestBullishCatalyst ?? "None"}
    </p>
  </div>

  <div className="rounded-lg border border-red-800 bg-red-950 p-3">
    <p className="text-xs font-semibold text-red-400">
      🔴 Strongest Bearish Risk
    </p>

    <p className="mt-1 text-sm">
      {content.strongestBearishRisk ?? "None"}
    </p>
  </div>
</div>

<div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
  <p className="text-xs font-semibold text-gray-400">
    Summary
  </p>

  <p className="mt-1 text-sm leading-6">
    {content.summary}
  </p>
</div>
    </div>
  );
}
