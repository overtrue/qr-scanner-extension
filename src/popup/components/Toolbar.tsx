import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Search, Copy, Download } from "lucide-react";

interface ToolbarProps {
  filter: string;
  onFilterChange: (value: string) => void;
  dedup: boolean;
  onDedupChange: (value: boolean) => void;
  collapse: boolean;
  onCollapseChange: (value: boolean) => void;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  onCopy: () => void;
  onExport: () => void;
  selectedCount: number;
  totalCount: number;
}

export function Toolbar({
  filter,
  onFilterChange,
  dedup,
  onDedupChange,
  collapse,
  onCollapseChange,
  allSelected,
  indeterminate,
  onSelectAll,
  onCopy,
  onExport,
  selectedCount,
  totalCount,
}: ToolbarProps) {
  return (
    <div className="px-4 py-2.5 border-b space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="搜索二维码内容..."
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3">
        {/* Select all */}
        <div className="flex items-center gap-1.5">
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onCheckedChange={onSelectAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{totalCount}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Dedup */}
        <div className="flex items-center gap-1.5">
          <Switch checked={dedup} onCheckedChange={onDedupChange} />
          <span className="text-xs text-muted-foreground">去重</span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Collapse */}
        <div className="flex items-center gap-1.5">
          <Switch checked={collapse} onCheckedChange={onCollapseChange} />
          <span className="text-xs text-muted-foreground">折叠</span>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={onCopy} className="h-7 text-xs gap-1">
          <Copy className="h-3 w-3" />
          复制
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="h-7 text-xs gap-1">
          <Download className="h-3 w-3" />
          CSV
        </Button>
      </div>
    </div>
  );
}
