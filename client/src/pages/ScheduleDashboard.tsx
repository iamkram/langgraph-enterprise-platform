import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Play, Pause, TrendingUp, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function ScheduleDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: schedules, isLoading, refetch } = trpc.schedules.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });
  
  // TODO: Add recentExecutions endpoint
  const recentExecutions: any[] = [];
  
  const updateMutation = trpc.schedules.update.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated");
      refetch();
    },
  });
  
  const handleToggle = (scheduleId: number, currentIsActive: number) => {
    updateMutation.mutate({
      id: scheduleId,
      isActive: currentIsActive ? 0 : 1,
    });
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Schedule Dashboard</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your schedules</p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }
  
  const activeSchedules = schedules?.filter((s: any) => s.isActive) || [];
  const inactiveSchedules = schedules?.filter(s => !s.isActive) || [];
  
  // Calculate success rate from recent executions
  const successfulExecutions = recentExecutions?.filter(e => e.status === 'success').length || 0;
  const totalExecutions = recentExecutions?.length || 0;
  const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Schedule Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your automated agent executions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "secondary"} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{schedules?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSchedules.length} active, {inactiveSchedules.length} inactive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{successRate}%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {totalExecutions} executions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-3xl font-bold">{successfulExecutions}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent executions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div className="text-3xl font-bold">{totalExecutions - successfulExecutions}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent executions
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Active Schedules */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Schedules ({activeSchedules.length})</CardTitle>
          <CardDescription>Currently running automated executions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeSchedules.length > 0 ? (
            <div className="space-y-3">
              {activeSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{schedule.name}</h3>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{schedule.cronExpression}</code>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {schedule.lastExecutedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last run: {new Date(schedule.lastExecutedAt).toLocaleString()}
                        </span>
                      )}
                      {schedule.notifyOnCompletion === 1 && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Notifications enabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(schedule.id, schedule.isActive)}
                    disabled={updateMutation.isPending}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active schedules</p>
              <p className="text-sm mt-1">Create schedules from the agent details page</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Latest automated agent runs</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExecutions && recentExecutions.length > 0 ? (
            <div className="space-y-2">
              {recentExecutions.slice(0, 10).map((execution: any) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded text-sm">
                  <div className="flex items-center gap-3">
                    {execution.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <div className="font-medium">Schedule #{execution.scheduleId}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(execution.executedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={execution.status === 'success' ? 'default' : 'destructive'}>
                    {execution.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No execution history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
