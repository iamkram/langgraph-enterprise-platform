import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, History, RotateCcw, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface VersionHistoryProps {
  agentConfigId: number;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollback?: () => void;
}

export function VersionHistory({ agentConfigId, agentName, open, onOpenChange, onRollback }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  const { data: versions, isLoading } = trpc.versions.history.useQuery(
    { agentConfigId },
    { enabled: open }
  );
  
  const rollbackMutation = trpc.versions.rollback.useMutation({
    onSuccess: () => {
      toast.success("Successfully rolled back to selected version");
      onOpenChange(false);
      onRollback?.();
    },
    onError: (error) => {
      toast.error(`Failed to rollback: ${error.message}`);
    },
  });
  
  const handleRollback = (versionNumber: number) => {
    if (confirm(`Are you sure you want to rollback to version ${versionNumber}? This will create a new version with the previous configuration.`)) {
      rollbackMutation.mutate({ agentConfigId, versionNumber });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History: {agentName}
          </DialogTitle>
          <DialogDescription>
            View and rollback to previous versions of this agent configuration
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : versions && versions.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {versions.map((version, index) => (
                <Card 
                  key={version.id}
                  className={`cursor-pointer transition-all ${
                    selectedVersion === version.versionNumber 
                      ? 'ring-2 ring-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedVersion(version.versionNumber)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          Version {version.versionNumber}
                          {index === 0 && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                        </CardDescription>
                      </div>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRollback(version.versionNumber);
                          }}
                          disabled={rollbackMutation.isPending}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {version.changeDescription && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {version.changeDescription}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Model:</span> {version.modelName}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {version.agentType}
                      </div>
                      <div>
                        <span className="font-medium">Max Iterations:</span> {version.maxIterations}
                      </div>
                      <div>
                        <span className="font-medium">Max Retries:</span> {version.maxRetries}
                      </div>
                      <div>
                        <span className="font-medium">Security:</span>{" "}
                        {version.securityEnabled ? "Enabled" : "Disabled"}
                      </div>
                      <div>
                        <span className="font-medium">Checkpointing:</span>{" "}
                        {version.checkpointingEnabled ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                    {version.workerAgents && (
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Workers:</span>{" "}
                        {JSON.parse(version.workerAgents).length} configured
                      </div>
                    )}
                    {version.tools && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Tools:</span>{" "}
                        {JSON.parse(version.tools).length} configured
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-3 opacity-50" />
            <p>No version history available</p>
            <p className="text-sm">Versions are created when you update the agent</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
