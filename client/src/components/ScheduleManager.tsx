import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Clock, Play, Pause, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { SCHEDULE_TEMPLATES, getTemplatesByCategory } from "@shared/scheduleTemplates";

interface ScheduleManagerProps {
  agentConfigId: number;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleManager({ agentConfigId, agentName, open, onOpenChange }: ScheduleManagerProps) {
  const [name, setName] = useState("");
  const [cronExpression, setCronExpression] = useState("0 0 * * *"); // Daily at midnight
  const [input, setInput] = useState("");
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(false);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  
  const { data: schedules, isLoading, refetch } = trpc.schedules.list.useQuery(undefined, {
    enabled: open,
  });
  
  const createMutation = trpc.schedules.create.useMutation({
    onSuccess: () => {
      toast.success("Schedule created successfully");
      setCronExpression("0 0 * * *");
      setInput("");
      setName("");
      setNotifyOnCompletion(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });
  
  const updateMutation = trpc.schedules.update.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      refetch();
    },
  });
  
  const deleteMutation = trpc.schedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted");
      refetch();
    },
  });
  
  const handleCreate = () => {
    if (!cronExpression) {
      toast.error("Cron expression is required");
      return;
    }
    
    createMutation.mutate({
      agentConfigId,
      name: name || `Schedule for ${agentName}`,
      cronExpression,
      input: input || undefined,
      notifyOnCompletion,
    });
  };
  
  const handleToggle = (scheduleId: number, currentIsActive: number) => {
    updateMutation.mutate({
      id: scheduleId,
      isActive: currentIsActive ? 0 : 1,
    });
  };
  
  const handleDelete = (scheduleId: number) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteMutation.mutate({ id: scheduleId });
    }
  };
  
  const agentSchedules = schedules?.filter(s => s.agentConfigId === agentConfigId) || [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Agent: {agentName}
          </DialogTitle>
          <DialogDescription>
            Create recurring schedules to run this agent automatically
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Create New Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Schedule</CardTitle>
                <CardDescription>
                  Use cron expression format (e.g., "0 0 * * *" for daily at midnight)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                {showTemplates && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Quick Templates</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTemplates(false)}
                      >
                        Custom Expression
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Common Schedules</p>
                        <div className="grid grid-cols-2 gap-2">
                          {getTemplatesByCategory("common").map((template) => (
                            <Button
                              key={template.id}
                              variant="outline"
                              className="h-auto flex-col items-start p-3 text-left"
                              onClick={() => {
                                setCronExpression(template.cronExpression);
                                setName(template.name);
                                setShowTemplates(false);
                              }}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {template.description}
                              </div>
                              <code className="text-xs bg-muted px-1 rounded mt-1">
                                {template.cronExpression}
                              </code>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Advanced Schedules</p>
                        <div className="grid grid-cols-2 gap-2">
                          {getTemplatesByCategory("advanced").map((template) => (
                            <Button
                              key={template.id}
                              variant="outline"
                              className="h-auto flex-col items-start p-3 text-left"
                              onClick={() => {
                                setCronExpression(template.cronExpression);
                                setName(template.name);
                                setShowTemplates(false);
                              }}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {template.description}
                              </div>
                              <code className="text-xs bg-muted px-1 rounded mt-1">
                                {template.cronExpression}
                              </code>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {!showTemplates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    className="w-full"
                  >
                    ← Back to Templates
                  </Button>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="cron">Cron Expression</Label>
                  <Input
                    id="cron"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 0 * * *"
                  />
                  <p className="text-xs text-muted-foreground">
                    Common patterns: "0 * * * *" (hourly), "0 0 * * *" (daily), "0 0 * * 0" (weekly)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`Schedule for ${agentName}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="input">Input Data (Optional JSON)</Label>
                  <Textarea
                    id="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify"
                    checked={notifyOnCompletion}
                    onCheckedChange={setNotifyOnCompletion}
                  />
                  <Label htmlFor="notify">Notify on completion</Label>
                </div>
                
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Create Schedule
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {/* Existing Schedules */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Active Schedules ({agentSchedules.length})</h3>
              
              {agentSchedules.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mb-3 opacity-50" />
                    <p>No schedules created yet</p>
                  </CardContent>
                </Card>
              ) : (
                agentSchedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {schedule.cronExpression}
                            </code>
                            <Badge variant={schedule.isActive ? "default" : "secondary"}>
                              {schedule.isActive ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          
                          {schedule.input && (
                            <div className="text-xs text-muted-foreground">
                              Input: <code className="bg-muted px-1 rounded">{schedule.input}</code>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {schedule.lastExecutedAt && (
                              <span>Last run: {new Date(schedule.lastExecutedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggle(schedule.id, schedule.isActive)}
                            disabled={updateMutation.isPending}
                          >
                            {schedule.isActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHistory(schedule.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(schedule.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* Execution History Dialog */}
      {showHistory !== null && (
        <ExecutionHistoryDialog
          scheduleId={showHistory}
          open={showHistory !== null}
          onOpenChange={(open) => !open && setShowHistory(null)}
        />
      )}
    </Dialog>
  );
}

interface ExecutionHistoryDialogProps {
  scheduleId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ExecutionHistoryDialog({ scheduleId, open, onOpenChange }: ExecutionHistoryDialogProps) {
  const { data: history, isLoading } = trpc.schedules.history.useQuery(
    { scheduleId },
    { enabled: open }
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Execution History
          </DialogTitle>
          <DialogDescription>
            View past executions for this schedule
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((execution) => (
              <Card key={execution.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            execution.status === "completed"
                              ? "default"
                              : execution.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {execution.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(execution.startedAt).toLocaleString()}
                        </span>
                        {execution.duration && (
                          <span className="text-xs text-muted-foreground">
                            ({(execution.duration / 1000).toFixed(2)}s)
                          </span>
                        )}
                      </div>
                      
                      {execution.errorMessage && (
                        <p className="text-xs text-destructive mt-2">
                          Error: {execution.errorMessage}
                        </p>
                      )}
                      
                      {execution.outputData && (
                        <details className="text-xs mt-2">
                          <summary className="cursor-pointer text-muted-foreground">
                            View output
                          </summary>
                          <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto">
                            {execution.outputData}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-3 opacity-50" />
            <p>No execution history yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
