import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAgentIds: number[];
  onSuccess?: () => void;
}

export function BulkTagDialog({ open, onOpenChange, selectedAgentIds, onSuccess }: BulkTagDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  const { data: tags, isLoading } = trpc.tags.list.useQuery(undefined, { enabled: open });
  
  const bulkAddTagsMutation = trpc.bulk.addTags.useMutation({
    onSuccess: () => {
      toast.success(`Tags added to ${selectedAgentIds.length} agent(s)`);
      setSelectedTagIds([]);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to add tags: ${error.message}`);
    },
  });
  
  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };
  
  const handleApply = () => {
    if (selectedTagIds.length === 0) {
      toast.error("Please select at least one tag");
      return;
    }
    
    bulkAddTagsMutation.mutate({
      agentIds: selectedAgentIds,
      tagIds: selectedTagIds,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Add Tags to {selectedAgentIds.length} Agent(s)
          </DialogTitle>
          <DialogDescription>
            Select tags to add to the selected agents
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                onClick={() => handleToggleTag(tag.id)}
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => handleToggleTag(tag.id)}
                />
                <Badge style={{ backgroundColor: tag.color }} className="text-white">
                  {tag.name}
                </Badge>
                {tag.description && (
                  <span className="text-sm text-muted-foreground flex-1">
                    {tag.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mb-3 opacity-50" />
            <p>No tags available</p>
            <p className="text-sm">Create tags first to organize your agents</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedTagIds.length === 0 || bulkAddTagsMutation.isPending}
          >
            {bulkAddTagsMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Add Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
