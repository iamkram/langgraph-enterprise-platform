import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, X, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TagFilterProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [newTagDescription, setNewTagDescription] = useState("");
  
  const { data: tags, isLoading, refetch } = trpc.tags.list.useQuery();
  
  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created successfully");
      setCreateDialogOpen(false);
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setNewTagDescription("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });
  
  const handleToggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };
  
  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }
    
    createTagMutation.mutate({
      name: newTagName.trim(),
      color: newTagColor,
      description: newTagDescription.trim() || undefined,
    });
  };
  
  const selectedTagsData = tags?.filter(tag => selectedTags.includes(tag.id)) || [];
  
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-2" />
              Filter by Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filter by Tags</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : tags && tags.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {tags.map(tag => (
                      <div
                        key={tag.id}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-accent'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleToggleTag(tag.id)}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm flex-1">{tag.name}</span>
                        {selectedTags.includes(tag.id) && (
                          <Badge variant="secondary" className="text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Tag className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No tags yet</p>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => setCreateDialogOpen(true)}
                    className="mt-2"
                  >
                    Create your first tag
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {selectedTagsData.map(tag => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color }}
            className="text-white cursor-pointer hover:opacity-80"
            onClick={() => handleToggleTag(tag.id)}
          >
            {tag.name}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
        
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTagsChange([])}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>
      
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a tag to organize and filter your agents
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Production, Testing, Research"
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="tag-color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Badge style={{ backgroundColor: newTagColor }} className="text-white">
                  {newTagName || "Preview"}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag-description">Description (Optional)</Label>
              <Input
                id="tag-description"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Brief description of this tag"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTagMutation.isPending}
            >
              {createTagMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
