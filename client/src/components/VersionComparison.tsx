import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, GitCompare, ArrowRight } from "lucide-react";

interface VersionComparisonProps {
  agentConfigId: number;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionComparison({ agentConfigId, agentName, open, onOpenChange }: VersionComparisonProps) {
  const [version1, setVersion1] = useState<number | null>(null);
  const [version2, setVersion2] = useState<number | null>(null);
  
  const { data: versions, isLoading: versionsLoading } = trpc.versions.history.useQuery(
    { agentConfigId },
    { enabled: open }
  );
  
  const { data: comparison, isLoading: comparisonLoading } = trpc.versions.compare.useQuery(
    {
      agentConfigId,
      versionNumber1: version1!,
      versionNumber2: version2!,
    },
    { enabled: version1 !== null && version2 !== null && version1 !== version2 }
  );
  
  const renderValue = (value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Not set</span>;
    if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
    if (Array.isArray(value)) return `${value.length} item(s)`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };
  
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      description: 'Description',
      agentType: 'Agent Type',
      modelName: 'Model',
      systemPrompt: 'System Prompt',
      maxIterations: 'Max Iterations',
      maxRetries: 'Max Retries',
      securityEnabled: 'Security',
      checkpointingEnabled: 'Checkpointing',
      workerAgents: 'Worker Agents',
      tools: 'Tools',
    };
    return labels[field] || field;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Versions: {agentName}
          </DialogTitle>
          <DialogDescription>
            Select two versions to compare their configurations side-by-side
          </DialogDescription>
        </DialogHeader>
        
        {versionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : versions && versions.length >= 2 ? (
          <div className="space-y-4">
            {/* Version Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Version A</label>
                <Select value={version1?.toString() || ""} onValueChange={(v) => setVersion1(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version..." />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.versionNumber.toString()}>
                        Version {v.versionNumber} - {new Date(v.createdAt).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Version B</label>
                <Select value={version2?.toString() || ""} onValueChange={(v) => setVersion2(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version..." />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.versionNumber.toString()}>
                        Version {v.versionNumber} - {new Date(v.createdAt).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Comparison Results */}
            {version1 !== null && version2 !== null && version1 !== version2 && (
              comparisonLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comparison ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Comparison Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">Version {comparison.version1.versionNumber}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="font-medium">Version {comparison.version2.versionNumber}</span>
                        </div>
                        <Badge variant={comparison.changedCount > 0 ? "default" : "secondary"}>
                          {comparison.changedCount} change(s)
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Differences */}
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {comparison.differences.map((diff, index) => (
                        <Card key={index} className={diff.changed ? 'border-primary/50' : ''}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{getFieldLabel(diff.field)}</CardTitle>
                              {diff.changed && (
                                <Badge variant="outline" className="text-xs">Changed</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Version {comparison.version1.versionNumber}</div>
                                <div className={`p-3 rounded-md ${diff.changed ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted'}`}>
                                  <pre className="text-xs whitespace-pre-wrap break-words">
                                    {renderValue(diff.oldValue)}
                                  </pre>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Version {comparison.version2.versionNumber}</div>
                                <div className={`p-3 rounded-md ${diff.changed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted'}`}>
                                  <pre className="text-xs whitespace-pre-wrap break-words">
                                    {renderValue(diff.newValue)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : null
            )}
            
            {version1 === version2 && version1 !== null && (
              <div className="text-center py-8 text-muted-foreground">
                Please select two different versions to compare
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <GitCompare className="h-12 w-12 mb-3 opacity-50" />
            <p>Need at least 2 versions to compare</p>
            <p className="text-sm">Create more versions by updating the agent</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
