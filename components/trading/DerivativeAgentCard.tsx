import type { DerivativesMetrics } from "@/lib/market-data/types";

interface DerivativeAgentCardProps {
  title: string;
  icon: string;
  content: DerivativesMetrics | null;
}

export function DerivativeAgentCard({
  title,
  icon,
  content,
}: DerivativeAgentCardProps) {


  if (!content) {
    return (
      <div className="bg-gray-900 p-4 rounded-xl">
        <h3 className="mb-3 font-semibold">
          {icon} {title}
        </h3>

        <p className="text-sm text-gray-400">
          Loading derivatives metrics...
        </p>
      </div>
    );
  }
    let interpretation = "No clear positioning signal.";

if (content.positioningState === "PRICE_UP_OI_UP") {
  interpretation = "Price ↑ + OI ↑ → bullish positioning build";
} else if (content.positioningState === "PRICE_UP_OI_DOWN") {
  interpretation = "Price ↑ + OI ↓ → likely short covering";
} else if (content.positioningState === "PRICE_DOWN_OI_UP") {
  interpretation = "Price ↓ + OI ↑ → bearish positioning build";
} else if (content.positioningState === "PRICE_DOWN_OI_DOWN") {
  interpretation = "Price ↓ + OI ↓ → likely long liquidation";
}

  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {icon} {title}
        </h3>

        <span className="text-xs text-gray-400">
          Confidence {content.confidence}%
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Price Change</span>
          <span>{content.priceChangePercent?.toFixed(2) ?? "N/A"}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">OI Change</span>
          <span>
            {content.openInterestChangePercent?.toFixed(2) ?? "N/A"}%
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Funding</span>
          <span>{content.fundingPercent?.toFixed(4) ?? "N/A"}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Long / Short</span>
          <span>{content.longShortBias}</span>
        </div>

        <div className="border-t border-gray-800 my-3" />

        <div className="flex justify-between">
          <span className="text-gray-400">Positioning</span>
          <span>{content.positioningBias}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Crowding Risk</span>
          <span>{content.crowdingRisk}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Signal</span>
          <span className="font-semibold">
            {content.derivativesSignal}
          </span>
        </div>
        <div className="mt-4 border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500 mb-1">
        Interpretation
        </p>

     <p className="text-sm text-gray-300">
       {interpretation}
     </p>
    </div>
      </div>
    </div>
  );
}