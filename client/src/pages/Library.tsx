import { useState } from "react";
import { ArrowLeft, Search, Star, TrendingUp, Clock, Filter, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Library() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "rating">("recent");
  const [showMyOnly, setShowMyOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"tools" | "agents">("tools");

  // Fetch tools
  const { data: tools = [], refetch: refetchTools, isLoading: toolsLoading } = trpc.library.getTools.useQuery({
    search: searchQuery,
    sortBy,
    myOnly: showMyOnly,
    limit: 50,
  });

  // Fetch agents
  const { data: agents = [], refetch: refetchAgents, isLoading: agentsLoading } = trpc.library.getAgents.useQuery({
    search: searchQuery,
    sortBy,
    myOnly: showMyOnly,
    limit: 50,
  });

  // Mutations
  const rateMutation = trpc.library.rate.useMutation({
    onSuccess: () => {
      toast.success("Rating submitted!");
      refetchTools();
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Failed to rate: ${error.message}`);
    },
  });

  const deleteToolMutation = trpc.library.deleteTool.useMutation({
    onSuccess: () => {
      toast.success("Tool deleted!");
      refetchTools();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const deleteAgentMutation = trpc.library.deleteAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted!");
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleRate = (itemType: "tool" | "agent", itemId: number, rating: number) => {
    rateMutation.mutate({ itemType, itemId, rating });
  };

  const handleDeleteTool = (id: number) => {
    if (confirm("Are you sure you want to delete this tool?")) {
      deleteToolMutation.mutate({ id });
    }
  };

  const handleDeleteAgent = (id: number) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      deleteAgentMutation.mutate({ id });
    }
  };

  const renderStars = (averageRating: number, itemType: "tool" | "agent", itemId: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(itemType, itemId, star)}
            className="hover:scale-110 transition-transform"
          >
            <Star
              className={`w-4 h-4 ${
                star <= Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Custom Library</h1>
                <p className="text-sm text-muted-foreground">
                  Browse and share custom tools and agents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Most Recent
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Most Popular
                  </div>
                </SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Highest Rated
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showMyOnly ? "default" : "outline"}
              onClick={() => setShowMyOnly(!showMyOnly)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showMyOnly ? "My Items" : "All Items"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tools">
              Custom Tools ({tools.length})
            </TabsTrigger>
            <TabsTrigger value="agents">
              Custom Agents ({agents.length})
            </TabsTrigger>
          </TabsList>

          {/* Tools Tab */}
          <TabsContent value="tools" className="mt-6">
            {toolsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading tools...
              </div>
            ) : tools.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {showMyOnly
                      ? "You haven't created any custom tools yet."
                      : "No custom tools found."}
                  </p>
                  <Button onClick={() => setLocation("/agents/create")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Tool
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool: any) => (
                  <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {tool.description}
                          </CardDescription>
                        </div>
                        {showMyOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTool(tool.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Rating */}
                        {renderStars(tool.averageRating, "tool", tool.id)}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {tool.usageCount} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(tool.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Tags */}
                        {tool.tags && tool.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tool.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Parameters Preview */}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Parameters:</span>{" "}
                          {Object.keys(tool.parameters.properties || {}).length} fields
                        </div>

                        {/* Visibility Badge */}
                        <Badge variant={tool.isPublic ? "default" : "outline"} className="text-xs">
                          {tool.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="mt-6">
            {agentsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading agents...
              </div>
            ) : agents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {showMyOnly
                      ? "You haven't created any custom agents yet."
                      : "No custom agents found."}
                  </p>
                  <Button onClick={() => setLocation("/agents/create")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent: any) => (
                  <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription className="mt-1 font-medium">
                            {agent.role}
                          </CardDescription>
                        </div>
                        {showMyOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Goal */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {agent.goal}
                        </p>

                        {/* Rating */}
                        {renderStars(agent.averageRating, "agent", agent.id)}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {agent.usageCount} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Tags */}
                        {agent.tags && agent.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {agent.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Tools */}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Tools:</span>{" "}
                          {agent.tools.length} configured
                        </div>

                        {/* Visibility Badge */}
                        <Badge variant={agent.isPublic ? "default" : "outline"} className="text-xs">
                          {agent.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
