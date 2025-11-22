import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Bot, Sparkles, Layers, MessageSquare, Zap, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { AIChatBox, type Message } from "@/components/AIChatBox";

export default function EnhancedHome() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  
  const { data: agents, isLoading } = trpc.agents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: suggestedQuestions } = trpc.docsChat.getSuggestedQuestions.useQuery();
  
  const sendMessageMutation = trpc.docsChat.sendMessage.useMutation({
    onSuccess: (data: any) => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
      }]);
    },
    onError: (error: any) => {
      toast.error(`Failed to get response: ${error.message}`);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessage: Message = { role: 'user', content };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    
    sendMessageMutation.mutate({
      messages: updatedMessages,
    });
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to AIM</CardTitle>
            <CardDescription>
              Create and manage intelligent agent integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" asChild>
              <a href={getLoginUrl()}>
                Sign In to Get Started
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentAgents = agents?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'User'}</h1>
              <p className="text-muted-foreground mt-1">
                Build intelligent agents with LangGraph
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/templates">
                <Button variant="outline" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Templates
                </Button>
              </Link>
              <Link href="/create">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Agent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Documentation Chat */}
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Documentation Assistant</CardTitle>
                    <CardDescription>
                      Ask me anything about creating agents, templates, or platform features
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AIChatBox
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isLoading={sendMessageMutation.isPending}
                  placeholder="Ask about agents, templates, tools..."
                  height="500px"
                />
                
                {/* Suggested Questions */}
                {chatMessages.length === 0 && suggestedQuestions && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.slice(0, 3).map((question: string, idx: number) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestedQuestion(question)}
                          className="text-xs"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Quick Actions & Recent Agents */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href="/create">
                  <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
                    <div className="flex items-start gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">Create New Agent</div>
                        <div className="text-sm text-muted-foreground">Build a custom agent from scratch</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>

                <Link href="/templates">
                  <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
                    <div className="flex items-start gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">Browse Templates</div>
                        <div className="text-sm text-muted-foreground">Start with pre-built agent configurations</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>

                <Link href="/architecture">
                  <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
                    <div className="flex items-start gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">View Architecture</div>
                        <div className="text-sm text-muted-foreground">Explore agent patterns and workflows</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Agents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Recent Agents
                  </CardTitle>
                  {agents && agents.length > 3 && (
                    <Link href="/agents">
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentAgents.length > 0 ? (
                  <div className="space-y-3">
                    {recentAgents.map((agent) => (
                      <Link key={agent.id} href={`/agent/${agent.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">{agent.name}</h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {agent.agentType}
                                  </Badge>
                                </div>
                                {agent.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {agent.description}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No agents yet. Create your first agent to get started!
                    </p>
                    <Link href="/create">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Agent
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <BookOpen className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">1</span>
                  </div>
                  <p className="text-blue-900/80 dark:text-blue-100/80">
                    <strong>Choose a template</strong> or create a custom agent
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">2</span>
                  </div>
                  <p className="text-blue-900/80 dark:text-blue-100/80">
                    <strong>Configure workers and tools</strong> for your use case
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">3</span>
                  </div>
                  <p className="text-blue-900/80 dark:text-blue-100/80">
                    <strong>Generate code</strong> and deploy your agent
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
