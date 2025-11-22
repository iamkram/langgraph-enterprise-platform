import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, TrendingUp, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Library Agent Detail Page
 * 
 * Displays full specifications for a library agent including:
 * - Complete agent configuration
 * - Usage statistics and ratings
 * - "Clone This Agent" button to pre-fill wizard
 */
export default function LibraryAgentDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isCloning, setIsCloning] = useState(false);

  const { data: agent, isLoading } = trpc.library.getAgents.useQuery(
    { search: "", myOnly: false },
    {
      select: (data) => data.find((a: any) => a.id === parseInt(id || "0")),
    }
  );

  const incrementUsageMutation = trpc.library.incrementUsage.useMutation();

  const handleCloneAgent = () => {
    if (!agent) return;

    setIsCloning(true);

    // Increment usage count
    incrementUsageMutation.mutate(
      { itemId: agent.id, itemType: "agent" },
      {
        onSuccess: () => {
          // Store agent in session storage for wizard to pick up
          sessionStorage.setItem(
            "pendingAgent",
            JSON.stringify({
              name: agent.name,
              role: agent.role,
              goal: agent.goal,
              backstory: agent.backstory,
              tools: agent.tools,
              allow_delegation: agent.allowDelegation,
            })
          );

          toast.success("Agent configuration copied! Redirecting to wizard...");

          // Navigate to agent creation wizard
          setTimeout(() => {
            setLocation("/agents/create");
          }, 1000);
        },
        onError: (error: { message: string }) => {
          toast.error(`Failed to clone agent: ${error.message}`);
          setIsCloning(false);
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

  if (!agent) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Agent not found</p>
            <Button variant="outline" onClick={() => setLocation("/library")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tags = agent.tags ? JSON.parse(agent.tags) : [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/library")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
        <Button
          onClick={handleCloneAgent}
          disabled={isCloning}
          className="gap-2"
        >
          {isCloning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Clone This Agent
        </Button>
      </div>

      {/* Agent Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-3xl">{agent.name}</CardTitle>
              <CardDescription className="text-base font-semibold">
                {agent.role}
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
                  {agent.avgRating ? agent.avgRating.toFixed(1) : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {agent.ratingCount || 0} ratings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{agent.usageCount || 0}</p>
                <p className="text-xs text-muted-foreground">times used</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Visibility</p>
              <Badge variant={agent.isPublic ? "default" : "secondary"}>
                {agent.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{agent.goal}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backstory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{agent.backstory}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools & Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <CardDescription>
              Tools available to this agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agent.tools && agent.tools.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {agent.tools.map((tool: string) => (
                  <Badge key={tool} variant="outline">
                    {tool}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tools configured</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Agent configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Allow Delegation</span>
              <Badge variant={agent.allowDelegation ? "default" : "secondary"}>
                {agent.allowDelegation ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Full Configuration</CardTitle>
          <CardDescription>
            Complete agent specification in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(
              {
                name: agent.name,
                role: agent.role,
                goal: agent.goal,
                backstory: agent.backstory,
                tools: agent.tools,
                allow_delegation: agent.allowDelegation,
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>

      <Separator />

      {/* Creator Info */}
      <div className="text-sm text-muted-foreground">
        Created by User #{agent.userId} •{" "}
        {new Date(agent.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
