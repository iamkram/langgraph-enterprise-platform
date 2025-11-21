import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Activity, Users, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/**
 * Analytics Dashboard
 * 
 * Displays usage metrics, daily aggregations, and agent performance statistics.
 */
export default function Analytics() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: metrics, isLoading } = trpc.analytics.getDailyMetrics.useQuery({
    date: today,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalExecutions = metrics?.reduce((sum, m) => sum + (m.totalExecutions || 0), 0) || 0;
  const totalTokens = metrics?.reduce((sum, m) => sum + (m.totalTokens || 0), 0) || 0;
  const totalUsers = metrics?.reduce((sum, m) => sum + (m.uniqueUsers || 0), 0) || 0;
  const avgExecutionTime = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + (m.avgExecutionTimeMs || 0), 0) / metrics.length)
    : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Usage metrics and performance statistics for {today}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Agent runs today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">LLM tokens consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Unique users today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgExecutionTime}ms</div>
            <p className="text-xs text-muted-foreground">Per agent run</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>
            Detailed metrics by agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Agent ID</th>
                    <th className="text-right py-3 px-4">Executions</th>
                    <th className="text-right py-3 px-4">Tokens</th>
                    <th className="text-right py-3 px-4">Avg Time (ms)</th>
                    <th className="text-right py-3 px-4">Users</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">Agent #{metric.agentConfigId}</td>
                      <td className="text-right py-3 px-4">{metric.totalExecutions?.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{metric.totalTokens?.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{metric.avgExecutionTimeMs || 'N/A'}</td>
                      <td className="text-right py-3 px-4">{metric.uniqueUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No metrics available for today
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
