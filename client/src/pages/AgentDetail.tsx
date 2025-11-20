import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CodePreview from "@/components/CodePreview";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import TestRunDialog from "@/components/TestRunDialog";
import { Link, useParams } from "wouter";

export default function AgentDetail() {
  const params = useParams();
  const agentId = params.id ? parseInt(params.id) : 0;
  
  const { data: agent, isLoading: agentLoading } = trpc.agents.get.useQuery({ id: agentId });
  const { data: code, isLoading: codeLoading } = trpc.agents.getCode.useQuery({ id: agentId });
  
  if (agentLoading || codeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!agent) {
    return (
      <div className="container mx-auto py-12 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Agent not found</p>
            <Link href="/">
              <Button className="mt-4">Back to Agents</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
              {agent.description && (
                <p className="text-muted-foreground">{agent.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <TestRunDialog
                agentConfig={{
                  name: agent.name,
                  description: agent.description || '',
                  agentType: agent.agentType,
                  model: agent.modelName,
                  workers: JSON.parse(agent.workerAgents || '[]').map((name: string) => ({
                    name,
                    description: `Worker agent: ${name}`,
                    systemPrompt: `You are a ${name} agent.`,
                  })),
                  tools: JSON.parse(agent.tools || '[]'),
                  security: {
                    enablePiiDetection: agent.securityEnabled,
                    enableGuardrails: agent.securityEnabled,
                    enableCheckpointing: agent.checkpointingEnabled,
                  },
                }}
                agentId={agent.id}
              />
              <Badge variant="secondary" className="capitalize text-base px-4 py-2">
                {agent.agentType}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Configuration Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Agent settings and parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Model</p>
                <p className="text-base">{agent.modelName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Max Iterations</p>
                <p className="text-base">{agent.maxIterations}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Max Retries</p>
                <p className="text-base">{agent.maxRetries}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Security</p>
                <p className="text-base">{agent.securityEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            
            {agent.workerAgents && JSON.parse(agent.workerAgents).length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Worker Agents</p>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(agent.workerAgents).map((worker: string) => (
                    <Badge key={worker} variant="outline">{worker}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {agent.tools && JSON.parse(agent.tools).length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tools</p>
                <div className="space-y-2">
                  {JSON.parse(agent.tools).map((tool: any) => (
                    <div key={tool.name} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {agent.systemPrompt && (
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">System Prompt</p>
                <p className="text-sm bg-muted p-4 rounded-lg">{agent.systemPrompt}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Generated Code */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <CardDescription>
              LangGraph agent implementation ready to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodePreview
              completeCode={code?.complete}
              supervisorCode={code?.supervisor}
              workerCode={code?.worker}
              stateCode={code?.state}
              workflowCode={code?.workflow}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
