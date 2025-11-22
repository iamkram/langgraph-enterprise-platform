import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Tool Detail Page
 * 
 * Displays full specifications for a library tool including:
 * - Complete tool configuration
 * - Usage statistics and ratings
 * - "Use This Tool" button to add to wizard
 */
export default function ToolDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isAdding, setIsAdding] = useState(false);

  const { data: tool, isLoading } = trpc.library.getTools.useQuery(
    { search: "", myOnly: false },
    {
      select: (data) => data.find((t) => t.id === parseInt(id || "0")),
    }
  );

  const incrementUsageMutation = trpc.library.incrementUsage.useMutation();

  const handleUseThisTool = () => {
    if (!tool) return;

    setIsAdding(true);

    // Increment usage count
    incrementUsageMutation.mutate(
      { itemId: tool.id, itemType: "tool" },
      {
        onSuccess: () => {
          // Store tool in session storage for wizard to pick up
          sessionStorage.setItem(
            "pendingTool",
            JSON.stringify({
              name: tool.name,
              description: tool.description,
              parameters: JSON.parse(tool.parameters),
            })
          );

          toast.success("Tool added! Redirecting to agent wizard...");

          // Navigate to agent creation wizard
          setTimeout(() => {
            setLocation("/agents/create");
          }, 1000);
        },
        onError: (error: { message: string }) => {
          toast.error(`Failed to add tool: ${error.message}`);
          setIsAdding(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Tool not found</p>
            <Button variant="outline" onClick={() => setLocation("/library")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parameters = JSON.parse(tool.parameters);
  const tags = tool.tags ? JSON.parse(tool.tags) : [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/library")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
        <Button
          onClick={handleUseThisTool}
          disabled={isAdding}
          className="gap-2"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Use This Tool
        </Button>
      </div>

      {/* Tool Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-3xl">{tool.name}</CardTitle>
              <CardDescription className="text-base">
                {tool.description}
              </CardDescription>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {tool.avgRating ? tool.avgRating.toFixed(1) : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tool.ratingCount || 0} ratings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{tool.usageCount || 0}</p>
                <p className="text-xs text-muted-foreground">times used</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Visibility</p>
              <Badge variant={tool.isPublic ? "default" : "secondary"}>
                {tool.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Parameters Schema</CardTitle>
          <CardDescription>
            JSON schema defining the tool's input parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(parameters, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
          <CardDescription>
            How to use this tool in your agent configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`# Add this tool to your agent's tools list
tools = ["${tool.name}"]

# The tool will be available to your agent during execution
# Parameters: ${Object.keys(parameters).join(", ")}`}
          </pre>
        </CardContent>
      </Card>

      <Separator />

      {/* Creator Info */}
      <div className="text-sm text-muted-foreground">
        Created by User #{tool.userId} •{" "}
        {new Date(tool.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
