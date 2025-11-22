import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Clock, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";

export default function TraceAnalytics() {
  const { data: metrics, isLoading } = trpc.traceAnalytics.getTraceMetrics.useQuery({});
  const { data: history } = trpc.traceAnalytics.getExecutionHistory.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Trace Analytics"
        description="Monitor agent performance, execution metrics, and LangSmith traces"
        breadcrumbs={[
          { label: "Analytics" }
        ]}
      />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 max-w-7xl">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Executions</CardDescription>
              <CardTitle className="text-3xl">{metrics?.totalExecutions || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {metrics?.successfulExecutions || 0} success
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {metrics?.failedExecutions || 0} failed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-3xl">{metrics?.successRate.toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>Healthy performance</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Duration</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-muted-foreground" />
                {((metrics?.averageDuration || 0) / 1000).toFixed(2)}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metrics?.averageDuration}ms per execution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Cost</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
                {metrics?.estimatedTotalCost.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metrics?.totalTokensUsed.toLocaleString()} tokens used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Executions by Day */}
          <Card>
            <CardHeader>
              <CardTitle>Executions by Day</CardTitle>
              <CardDescription>Daily execution count and average duration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.executionsByDay.map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-24">{day.date}</span>
                      <Badge variant="outline">{day.count} runs</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(day.avgDuration / 1000).toFixed(2)}s avg
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Executions by Agent Type */}
          <Card>
            <CardHeader>
              <CardTitle>Executions by Agent Type</CardTitle>
              <CardDescription>Performance breakdown by agent architecture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.executionsByAgentType.map((type: any) => (
                  <div key={type.agentType} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="capitalize w-24">
                        {type.agentType}
                      </Badge>
                      <span className="text-sm font-medium">{type.count} runs</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(type.avgDuration / 1000).toFixed(2)}s avg
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Agents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
            <CardDescription>Most frequently executed agents with success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topAgents.map((agent: any, idx: number) => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      #{idx + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.executions} executions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={agent.successRate > 90 ? "default" : "secondary"} className="bg-green-500">
                      {agent.successRate.toFixed(1)}% success
                    </Badge>
                    <Link href={`/agents/${agent.agentId}`}>
                      <Button variant="ghost" size="sm">
                        View Agent
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Latest agent runs with LangSmith traces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history?.executions.map((execution: any) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">{execution.agentName}</p>
                      <Badge variant={execution.status === "success" ? "default" : "destructive"} className={execution.status === "success" ? "bg-green-500" : ""}>
                        {execution.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{execution.input}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {execution.duration}ms
                      </span>
                      <span>{execution.tokensUsed} tokens</span>
                      <span>${execution.cost.toFixed(4)}</span>
                      <span>{new Date(execution.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {execution.traceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(execution.traceUrl, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Trace
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
