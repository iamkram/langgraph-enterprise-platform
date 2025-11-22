import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAgentCreatorProps {
  availableTools?: string[];
  onAgentGenerated: (agentSpec: {
    name: string;
    role: string;
    goal: string;
    backstory: string;
    tools: string[];
    allow_delegation: boolean;
  }) => void;
  onCancel: () => void;
}

/**
 * AI Agent Creator Component
 * 
 * Provides an interactive chat interface for creating custom agents with LLM assistance.
 * Users describe what they want their agent to do, and the AI helps generate a complete configuration.
 */
export default function AIAgentCreator({
  availableTools = [],
  onAgentGenerated,
  onCancel,
}: AIAgentCreatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'll help you create a custom agent for your multi-agent system. What would you like your agent to specialize in? For example:\n\n- "Create a research agent that gathers information"\n- "I need an agent that writes reports"\n- "Build an agent that analyzes data"${
        availableTools.length > 0
          ? `\n\nAvailable tools: ${availableTools.join(", ")}`
          : ""
      }`,
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedAgent, setGeneratedAgent] = useState<{
    name: string;
    role: string;
    goal: string;
    backstory: string;
    tools: string[];
    allow_delegation: boolean;
  } | null>(null);

  const generateMutation = trpc.aiAssistant.generateAgent.useMutation({
    onSuccess: (data: {
      message: string;
      agentSpec: {
        name: string;
        role: string;
        goal: string;
        backstory: string;
        tools: string[];
        allow_delegation: boolean;
      } | null;
    }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.agentSpec) {
        setGeneratedAgent(data.agentSpec);
      }
    },
    onError: (error: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || generateMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    generateMutation.mutate({
      userMessage,
      conversationHistory: messages,
      availableTools,
    });
  };

  const handleAccept = () => {
    if (generatedAgent) {
      onAgentGenerated(generatedAgent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI Agent Creator</CardTitle>
        </div>
        <CardDescription>
          Describe what you want your agent to do, and I'll help you create it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 border rounded-lg bg-muted/30">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Streamdown>{msg.content}</Streamdown>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {generateMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-background border rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Generated Agent Preview */}
        {generatedAgent && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Agent Generated!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Name:</span> {generatedAgent.name}
              </div>
              <div>
                <span className="font-semibold">Role:</span> {generatedAgent.role}
              </div>
              <div>
                <span className="font-semibold">Goal:</span> {generatedAgent.goal}
              </div>
              <div>
                <span className="font-semibold">Backstory:</span>{" "}
                {generatedAgent.backstory}
              </div>
              <div>
                <span className="font-semibold">Tools:</span>{" "}
                {generatedAgent.tools.length > 0
                  ? generatedAgent.tools.join(", ")
                  : "None"}
              </div>
              <div>
                <span className="font-semibold">Delegation:</span>{" "}
                {generatedAgent.allow_delegation ? "Enabled" : "Disabled"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder="Describe your agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={generateMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || generateMutation.isPending}
            size="icon"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {generatedAgent && (
            <Button onClick={handleAccept} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Use This Agent
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
