import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AgentTagBadgesProps {
  agentConfigId: number;
}

export function AgentTagBadges({ agentConfigId }: AgentTagBadgesProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const { data: agentTags, refetch: refetchAgentTags } = trpc.tags.getAgentTags.useQuery({ agentConfigId });
  const { data: allTags } = trpc.tags.list.useQuery();
  
  const addTagMutation = trpc.tags.addToAgent.useMutation({
    onSuccess: () => {
      toast.success("Tag added");
      refetchAgentTags();
    },
    onError: (error) => {
      toast.error(`Failed to add tag: ${error.message}`);
    },
  });
  
  const removeTagMutation = trpc.tags.removeFromAgent.useMutation({
    onSuccess: () => {
      toast.success("Tag removed");
      refetchAgentTags();
    },
    onError: (error) => {
      toast.error(`Failed to remove tag: ${error.message}`);
    },
  });
  
  const handleAddTag = (tagId: number) => {
    addTagMutation.mutate({ agentConfigId, tagId });
    setPopoverOpen(false);
  };
  
  const handleRemoveTag = (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTagMutation.mutate({ agentConfigId, tagId });
  };
  
  const availableTags = allTags?.filter(
    tag => !agentTags?.some(at => at.id === tag.id)
  ) || [];
  
  return (
    <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {agentTags?.map(tag => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.color }}
          className="text-white text-xs cursor-pointer hover:opacity-80"
          onClick={(e) => handleRemoveTag(tag.id, e)}
        >
          {tag.name}
          <X className="h-2.5 w-2.5 ml-1" />
        </Badge>
      ))}
      
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="start">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Add Tag</p>
            {availableTags.length > 0 ? (
              <div className="space-y-1">
                {availableTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer"
                    onClick={() => handleAddTag(tag.id)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-xs">{tag.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                All tags already added
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
