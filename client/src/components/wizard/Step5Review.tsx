import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentFormStore } from "@/stores/agentFormStore";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Step5Review() {
  const {
    name,
    description,
    agentType,
    workerAgents,
    tools,
    securityEnabled,
    checkpointingEnabled,
    modelName,
    systemPrompt,
    maxIterations,
    maxRetries,
  } = useAgentFormStore();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-base">{name || "Not specified"}</p>
          </div>
          {description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{description}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Agent Type</p>
            <Badge variant="secondary" className="capitalize">{agentType}</Badge>
          </div>
        </CardContent>
      </Card>
      
      {agentType === 'supervisor' && workerAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Worker Agents ({workerAgents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {workerAgents.map((worker) => (
                <Badge key={worker} variant="outline">{worker}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {tools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tools ({tools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tools.map((tool) => (
                <div key={tool.name} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security & Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {securityEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Security Layer</span>
          </div>
          <div className="flex items-center gap-2">
            {checkpointingEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Checkpointing</span>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Model</p>
            <p className="text-base">{modelName}</p>
          </div>
          {systemPrompt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Prompt</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{systemPrompt}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Iterations</p>
              <p className="text-base">{maxIterations}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Retries</p>
              <p className="text-base">{maxRetries}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Click "Generate Code" to create your LangGraph agent configuration and code templates.
        </p>
      </div>
    </div>
  );
}
