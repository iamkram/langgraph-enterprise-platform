import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Check } from "lucide-react";

interface SmartTagSuggestionsProps {
  agentName: string;
  agentDescription?: string;
  agentType?: string;
  tools?: string[];
  onApplyTags: (tagIds: number[]) => void;
}

export function SmartTagSuggestions({
  agentName,
  agentDescription,
  agentType,
  tools,
  onApplyTags,
}: SmartTagSuggestionsProps) {
  const [appliedTagIds, setAppliedTagIds] = useState<Set<number>>(new Set());
  
  const { data: suggestions, isLoading } = trpc.tags.suggest.useQuery(
    {
      agentName,
      agentDescription,
      agentType,
      tools,
    },
    {
      enabled: agentName.length > 0,
      staleTime: 60000, // Cache for 1 minute
    }
  );
  
  const handleApplyTag = (tagId: number) => {
    const newApplied = new Set(appliedTagIds);
    if (newApplied.has(tagId)) {
      newApplied.delete(tagId);
    } else {
      newApplied.add(tagId);
    }
    setAppliedTagIds(newApplied);
    onApplyTags(Array.from(newApplied));
  };
  
  const handleApplyAll = () => {
    if (!suggestions?.suggestions) return;
    const allIds = suggestions.suggestions.map(s => s.id);
    setAppliedTagIds(new Set(allIds));
    onApplyTags(allIds);
  };
  
  if (!agentName) return null;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Smart Tag Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!suggestions || suggestions.suggestions.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Smart Tag Suggestions
        </CardTitle>
        <CardDescription className="text-xs">
          {suggestions.reasoning}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {suggestions.suggestions.map((tag) => {
            const isApplied = appliedTagIds.has(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isApplied ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: isApplied ? tag.color : 'transparent',
                  borderColor: tag.color,
                  color: isApplied ? 'white' : tag.color,
                }}
                onClick={() => handleApplyTag(tag.id)}
              >
                {isApplied && <Check className="h-3 w-3 mr-1" />}
                {tag.name}
              </Badge>
            );
          })}
        </div>
        
        {suggestions.suggestions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleApplyAll}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            Apply All Suggestions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
