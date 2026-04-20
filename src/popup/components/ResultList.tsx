import { ScrollArea } from "./ui/scroll-area";
import { ResultItem } from "./ResultItem";
import type { QRResult } from "../App";

interface ResultListProps {
  results: QRResult[];        // filtered results (for display)
  dedupResults: QRResult[];   // full dedup results (for index mapping)
  selected: Set<number>;
  onToggleSelect: (index: number) => void;
  collapse: boolean;
}

export function ResultList({ results, dedupResults, selected, onToggleSelect, collapse }: ResultListProps) {
  return (
    <ScrollArea className="flex-1 max-h-[340px]">
      {results.map((r, i) => {
        // Find this result's index in dedupResults for correct selection tracking
        const globalIndex = dedupResults.indexOf(r);
        return (
          <ResultItem
            key={`${globalIndex}-${r.content}`}
            result={r}
            index={i}
            globalIndex={globalIndex}
            checked={selected.has(globalIndex)}
            onToggle={onToggleSelect}
            collapse={collapse}
          />
        );
      })}
    </ScrollArea>
  );
}
