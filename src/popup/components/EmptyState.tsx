import { QrCode, ScanSearch } from "lucide-react";

interface EmptyStateProps {
  initial?: boolean;
}

export function EmptyState({ initial = false }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
      {initial ? (
        <>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <QrCode className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            点击「扫描当前页面」开始识别二维码
          </p>
        </>
      ) : (
        <>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <ScanSearch className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">此页面未发现二维码</p>
        </>
      )}
    </div>
  );
}
