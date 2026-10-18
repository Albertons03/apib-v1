import { AgentCard } from "./AgentCard";
import type {NewsSentimentResponse} from "@/lib/sentiment/types";
import { SentimentAgentCard } from "./SentimentAgentCard";
import { DerivativeAgentCard } from "./DerivativeAgentCard";
import { MarketCatalyst } from "@/lib/catalyst/types";
import type { DerivativesMetrics } from "@/lib/market-data/types";

interface AgentAnalysisGridProps {
  macro: string | undefined;
  technical: string | undefined;
  sentiment: NewsSentimentResponse | null;
  derivatives: DerivativesMetrics | null;
  catalysts: MarketCatalyst[];
}

export function AgentAnalysisGrid({
  macro,
  technical,
  sentiment,
  derivatives,
  catalysts
}: AgentAnalysisGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <AgentCard title="Macro" icon="🌍" content={macro} />
      <AgentCard title="Technical" icon="📈" content={technical} />
      <SentimentAgentCard title="Sentiment" icon="📰" content={sentiment} catalysts={catalysts} />
      <DerivativeAgentCard title="Derivatives" icon="📊" content={derivatives} />
    </div>
  );
}
