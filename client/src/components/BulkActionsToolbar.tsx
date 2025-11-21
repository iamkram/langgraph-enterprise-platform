import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, Download, Tag } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onBulkTag: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkTag,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
        <Badge variant="secondary" className="text-sm font-semibold">
          {selectedCount} selected
        </Badge>
        
        <div className="h-6 w-px bg-primary-foreground/20" />
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onBulkExport}
            title="Export selected agents"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={onBulkTag}
            title="Add tags to selected agents"
          >
            <Tag className="h-4 w-4 mr-1" />
            Tag
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={onBulkDelete}
            title="Delete selected agents"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        
        <div className="h-6 w-px bg-primary-foreground/20" />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="hover:bg-primary-foreground/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
