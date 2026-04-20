import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { Toolbar } from "./components/Toolbar";
import { ResultList } from "./components/ResultList";
import { EmptyState } from "./components/EmptyState";

export interface QRResult {
  content: string;
  sourceUrl: string;
  sourceType: string;
  pageUrl: string;
}

interface ScanProgress {
  total: number;
  scanned: number;
  found: number;
}

type ScanState = "idle" | "scanning" | "done";

export default function App() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState<ScanProgress>({ total: 0, scanned: 0, found: 0 });
  const [allResults, setAllResults] = useState<QRResult[]>([]);
  const [filter, setFilter] = useState("");
  const [dedup, setDedup] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [totalImages, setTotalImages] = useState(0);

  // Deduplicated results
  const dedupResults = useMemo(() => {
    if (!dedup) return allResults;
    const seen = new Set<string>();
    return allResults.filter((r) => {
      if (seen.has(r.content)) return false;
      seen.add(r.content);
      return true;
    });
  }, [allResults, dedup]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!filter.trim()) return dedupResults;
    const kw = filter.toLowerCase();
    return dedupResults.filter((r) => r.content.toLowerCase().includes(kw));
  }, [dedupResults, filter]);

  // Selected indices within dedupResults
  const selectedInView = useMemo(() => {
    const s = new Set<number>();
    selected.forEach((i) => {
      if (i < dedupResults.length) {
        const r = dedupResults[i];
        const kw = filter.toLowerCase();
        if (!filter.trim() || r.content.toLowerCase().includes(kw)) {
          s.add(i);
        }
      }
    });
    return s;
  }, [selected, dedupResults, filter]);

  // Initialize selected when results change
  useEffect(() => {
    setSelected(new Set(dedupResults.map((_, i) => i)));
  }, [dedupResults]);

  // Listen for messages from content script
  useEffect(() => {
    const handler = (message: { type: string; data: any }) => {
      if (message.type === "SCAN_PROGRESS") {
        setProgress(message.data);
      }
      if (message.type === "SCAN_COMPLETE") {
        setAllResults(message.data.results);
        setTotalImages(message.data.total);
        setScanState("done");
      }
    };
    chrome.runtime?.onMessage?.addListener(handler);
    return () => chrome.runtime?.onMessage?.removeListener(handler);
  }, []);

  const handleScan = useCallback(async () => {
    setScanState("scanning");
    setError(null);
    setAllResults([]);
    setProgress({ total: 0, scanned: 0, found: 0 });
    setFilter("");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setError("无法获取当前标签页");
        setScanState("idle");
        return;
      }
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["lib/jsQR.js"] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/scanner.js"] });
    } catch (e: any) {
      setError("无法扫描此页面: " + e.message);
      setScanState("idle");
    }
  }, []);

  const handleToggleSelect = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      // Select all visible (filtered) items
      const indices = new Set<number>();
      dedupResults.forEach((r, i) => {
        const kw = filter.toLowerCase();
        if (!filter.trim() || r.content.toLowerCase().includes(kw)) {
          indices.add(i);
        }
      });
      setSelected(indices);
    } else {
      setSelected(new Set());
    }
  }, [dedupResults, filter]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleCopy = useCallback(() => {
    const items = Array.from(selectedInView)
      .sort((a, b) => a - b)
      .map((i) => dedupResults[i]);
    if (items.length === 0) {
      showToast("没有选中的项目");
      return;
    }
    const text = items.map((r, i) => `${i + 1}. ${r.content}`).join("\n");
    navigator.clipboard.writeText(text).then(() => showToast(`已复制 ${items.length} 条结果`));
  }, [selectedInView, dedupResults, showToast]);

  const handleExport = useCallback(() => {
    const items = Array.from(selectedInView)
      .sort((a, b) => a - b)
      .map((i) => dedupResults[i]);
    if (items.length === 0) {
      showToast("没有选中的项目");
      return;
    }
    const BOM = "\uFEFF";
    const header = "序号,内容,来源类型,来源URL,页面URL";
    const escCSV = (s: string) => s.replace(/"/g, '""');
    const rows = items.map(
      (r, i) => `${i + 1},"${escCSV(r.content)}","${r.sourceType}","${escCSV(r.sourceUrl)}","${escCSV(r.pageUrl)}"`
    );
    const csv = BOM + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    a.download = `qr-codes-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${items.length} 条结果`);
  }, [selectedInView, dedupResults, showToast]);

  const allVisibleSelected = filteredResults.length > 0 && selectedInView.size === filteredResults.length;
  const someVisibleSelected = selectedInView.size > 0 && selectedInView.size < filteredResults.length;

  return (
    <div className="flex flex-col min-h-[320px] max-h-[580px]">
      <Header scanState={scanState} onScan={handleScan} />

      {scanState !== "idle" && (
        <StatusBar
          progress={progress}
          scanState={scanState}
          totalImages={totalImages}
          resultCount={allResults.length}
          dedupCount={dedupResults.length}
          dedup={dedup}
          error={error}
        />
      )}

      {scanState === "done" && dedupResults.length > 0 && (
        <>
          <Toolbar
            filter={filter}
            onFilterChange={setFilter}
            dedup={dedup}
            onDedupChange={setDedup}
            allSelected={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onSelectAll={handleSelectAll}
            onCopy={handleCopy}
            onExport={handleExport}
            selectedCount={selectedInView.size}
            totalCount={filteredResults.length}
          />
          <ResultList
            results={filteredResults}
            dedupResults={dedupResults}
            selected={selected}
            onToggleSelect={handleToggleSelect}
          />
        </>
      )}

      {scanState === "done" && dedupResults.length === 0 && <EmptyState />}
      {scanState === "idle" && <EmptyState initial />}

      {/* Footer */}
      <div className="shrink-0 px-4 py-2 border-t text-center bg-background">
        <span className="text-[11px] text-muted-foreground">
          Made by{" "}
          <a
            href="https://github.com/overtrue"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            overtrue
          </a>
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
