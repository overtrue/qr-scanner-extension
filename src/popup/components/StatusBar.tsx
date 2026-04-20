import { Progress } from "./ui/progress";

interface StatusBarProps {
  progress: { total: number; scanned: number; found: number };
  scanState: "idle" | "scanning" | "done";
  totalImages: number;
  resultCount: number;
  dedupCount: number;
  dedup: boolean;
  error: string | null;
}

export function StatusBar({
  progress,
  scanState,
  totalImages,
  resultCount,
  dedupCount,
  dedup,
  error,
}: StatusBarProps) {
  const pct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0;

  if (error) {
    return (
      <div className="px-4 py-2.5 bg-destructive/10 border-b">
        <p className="text-xs text-destructive">{error}</p>
      </div>
    );
  }

  if (scanState === "scanning") {
    return (
      <div className="px-4 py-2.5 border-b space-y-1.5">
        <Progress value={pct} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          已扫描 {progress.scanned}/{progress.total} 张图片，发现 {progress.found} 个二维码
        </p>
      </div>
    );
  }

  if (scanState === "done") {
    const dedupInfo = dedup && dedupCount < resultCount
      ? `，去重后 ${dedupCount} 个`
      : "";
    return (
      <div className="px-4 py-2 border-b bg-muted/50">
        <p className="text-xs text-muted-foreground">
          共检查 {totalImages} 张图片，发现{" "}
          <span className="font-medium text-foreground">{resultCount}</span> 个二维码{dedupInfo}
        </p>
      </div>
    );
  }

  return null;
}
