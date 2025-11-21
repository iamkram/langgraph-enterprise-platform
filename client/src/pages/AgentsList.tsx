import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Bot, Trash2, Sparkles, Layers, GraduationCap, Download, Upload } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { useEffect } from "react";

export default function AgentsList() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isCompleted, startTutorial } = useTutorial();
  const { data: agents, isLoading, refetch } = trpc.agents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const utils = trpc.useUtils();
  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete agent: ${error.message}`);
    },
  });
  
  const importMutation = trpc.agents.import.useMutation({
    onSuccess: () => {
      toast.success("Agent imported successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to import agent: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExport = async (id: number, name: string) => {
    try {
      const result = await utils.agents.export.fetch({ id });
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-agent.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Agent exported successfully");
    } catch (error) {
      toast.error("Failed to export agent");
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate basic structure
        if (!data.version || !data.agent) {
          throw new Error('Invalid agent file format');
        }
        
        importMutation.mutate({ data });
      } catch (error) {
        toast.error(`Failed to import agent: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
      }
    };
    input.click();
  };
  
  // Auto-start tutorial for first-time users with no agents
  useEffect(() => {
    if (isAuthenticated && !isLoading && agents && agents.length === 0 && !isCompleted) {
      // Delay to allow page to render
      const timer = setTimeout(() => startTutorial(), 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, agents, isCompleted, startTutorial]);
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Agentic Integration Maker (AIM)</CardTitle>
            <CardDescription>
              Create and manage intelligent agent integrations with our intuitive form-based interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In to Get Started</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-12 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agentic Integration Maker (AIM)</h1>
            <p className="text-muted-foreground">
              Create, manage, and generate code for your intelligent agent integrations
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={startTutorial}
              title="Restart tutorial"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Tutorial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleImport}
              title="Import agent from JSON"
            >
              <Upload className="mr-2 h-5 w-5" />
              Import
            </Button>
            <Link href="/templates">
              <Button size="lg" variant="outline" data-tutorial="templates-button">
                <Sparkles className="mr-2 h-5 w-5" />
                Templates
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="lg" variant="outline">
                View Analytics
              </Button>
            </Link>
            <Link href="/architecture">
              <Button size="lg" variant="outline">
                <Layers className="mr-2 h-5 w-5" />
                Architecture
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" data-tutorial="create-button">
                <Plus className="mr-2 h-5 w-5" />
                Create New Agent
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Agents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {agent.agentType}
                    </Badge>
                  </div>
                  {agent.description && (
                    <CardDescription className="line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{agent.modelName}</span>
                    </div>
                    {agent.workerAgents && JSON.parse(agent.workerAgents).length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Workers:</span>
                        <span className="font-medium">
                          {JSON.parse(agent.workerAgents).length}
                        </span>
                      </div>
                    )}
                    {agent.tools && JSON.parse(agent.tools).length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tools:</span>
                        <span className="font-medium">
                          {JSON.parse(agent.tools).length}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/agent/${agent.id}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full">
                          View Code
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(agent.id, agent.name)}
                        title="Export agent"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(agent.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first intelligent agent integration
              </p>
              <Link href="/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Agent
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      <TutorialOverlay />
    </div>
  );
}
