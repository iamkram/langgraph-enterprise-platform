import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";
import { Loader2, Send, Sparkles, FileCode, LayoutTemplate, BarChart3 } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function EnhancedHome() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const chatMutation = trpc.docsChat.chat.useMutation();
  const { data: agents } = trpc.agents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const suggestedQuestions = [
    "How do I create my first agent?",
    "What's the difference between supervisor and single agents?",
    "How does LangSmith tracing work?",
  ];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({
        message: input,
        conversationHistory: messages,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const recentAgents = agents?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">Create, manage, and generate code for your intelligent agent integrations</p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Documentation Chat */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Documentation Assistant
                </CardTitle>
                <CardDescription>
                  Ask me anything about creating agents, templates, tools, and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chat Messages */}
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Start a conversation with AI</p>
                      <p className="text-sm mt-2">Ask about agents, templates, or platform features</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <Streamdown>{msg.content}</Streamdown>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Suggested Questions */}
                {messages.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((q, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestedQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={chatMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || chatMutation.isPending}
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Quick Actions & Recent Agents */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <Link href="/agents/create">
                  <Button className="w-full justify-start h-auto py-4" variant="outline">
                    <FileCode className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Create New Agent</div>
                      <div className="text-xs text-muted-foreground">Build a custom agent from scratch</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button className="w-full justify-start h-auto py-4" variant="outline">
                    <LayoutTemplate className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Browse Templates</div>
                      <div className="text-xs text-muted-foreground">Start from pre-built templates</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/architecture">
                  <Button className="w-full justify-start h-auto py-4" variant="outline">
                    <BarChart3 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">View Architecture</div>
                      <div className="text-xs text-muted-foreground">Explore system architecture</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Agents */}
            {isAuthenticated && recentAgents.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Agents</CardTitle>
                  <CardDescription>Your latest agent configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentAgents.map((agent) => (
                    <Link key={agent.id} href={`/agents/${agent.id}`}>
                      <Card className="hover:bg-accent transition-colors cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">
                            {agent.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                  <Link href="/agents">
                    <Button variant="link" className="w-full">
                      View all agents →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Getting Started */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">1. Choose a template or create custom</h4>
                  <p className="text-muted-foreground">Start with a pre-built template or build from scratch</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">2. Configure workers and tools</h4>
                  <p className="text-muted-foreground">Define specialized workers and integrate tools</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">3. Generate code and deploy</h4>
                  <p className="text-muted-foreground">Get production-ready Python LangGraph code</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
