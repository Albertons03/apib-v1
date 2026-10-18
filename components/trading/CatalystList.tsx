import type { MarketCatalyst } from "@/lib/catalyst/types";

interface CatalystListProps {
  catalysts: MarketCatalyst[];
}

export function CatalystList({ catalysts }: CatalystListProps) {

    const directionColor = {
  BULLISH: "text-green-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-gray-400",
};

const priorityColor = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-yellow-500 text-black",
  MEDIUM: "bg-blue-600 text-white",
  LOW: "bg-gray-600 text-white",
};
  if (catalysts.length === 0) {
    return (
      <div>
        <p>🔥 Top Market Catalysts</p>
        <p className="text-sm text-gray-400">
          No catalyst data available.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 font-semibold">
        🔥 Top Market Catalysts
      </p>

      <div className="space-y-3">
        {catalysts.map((catalyst, index) => (
          <div
            key={`${catalyst.headline}-${index}`}
            className="rounded-lg border border-gray-700 p-3"
          >
            <p className="text-sm font-medium">
              {catalyst.headline}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
  <span className="rounded bg-gray-800 px-2 py-1">
    Score: {catalyst.score}
  </span>

  <span
    className={`font-bold ${directionColor[catalyst.direction]}`}
  >
    {catalyst.direction}
  </span>

  <span
    className={`rounded-full px-2 py-1 font-bold ${priorityColor[catalyst.priority]}`}
  >
    {catalyst.priority}
  </span>
</div>
          </div>
        ))}
      </div>
    </div>
  );
}