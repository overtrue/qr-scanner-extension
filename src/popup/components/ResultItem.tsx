import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { ExternalLink } from "lucide-react";
import type { QRResult } from "../App";

interface ResultItemProps {
  result: QRResult;
  index: number;
  globalIndex: number;
  checked: boolean;
  onToggle: (index: number) => void;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ResultItem({ result, index, globalIndex, checked, onToggle }: ResultItemProps) {
  const isUrl = isValidUrl(result.content);

  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/50 transition-colors animate-fade-in">
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(globalIndex)}
        className="mt-0.5"
      />

      <Badge variant="secondary" className="mt-0.5 min-w-[24px] justify-center text-[10px] font-mono">
        {index + 1}
      </Badge>

      <div className="flex-1 min-w-0 space-y-1">
        {isUrl ? (
          <a
            href={result.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline break-all inline-flex items-start gap-1"
          >
            {result.content}
            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
          </a>
        ) : (
          <p className="text-xs break-all font-mono text-foreground leading-relaxed">
            {result.content}
          </p>
        )}
      </div>

      {!result.sourceUrl.startsWith("data:") && (
        <img
          src={result.sourceUrl}
          alt=""
          className="w-8 h-8 rounded border object-cover shrink-0 bg-muted"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
    </div>
  );
}
