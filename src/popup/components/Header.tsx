import { Button } from "./ui/button";
import { QrCode, Loader2 } from "lucide-react";

interface HeaderProps {
  scanState: "idle" | "scanning" | "done";
  onScan: () => void;
}

export function Header({ scanState, onScan }: HeaderProps) {
  const isScanning = scanState === "scanning";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <QrCode className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-semibold tracking-tight">QR 码扫描器</h1>
      </div>
      <Button size="sm" onClick={onScan} disabled={isScanning}>
        {isScanning ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            扫描中
          </>
        ) : scanState === "done" ? (
          "重新扫描"
        ) : (
          "扫描当前页面"
        )}
      </Button>
    </div>
  );
}
