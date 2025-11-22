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

interface AIToolCreatorProps {
  onToolGenerated: (toolSpec: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }) => void;
  onCancel: () => void;
}

/**
 * AI Tool Creator Component
 * 
 * Provides an interactive chat interface for creating custom tools with LLM assistance.
 * Users describe what they want their tool to do, and the AI helps generate a complete specification.
 */
export default function AIToolCreator({ onToolGenerated, onCancel }: AIToolCreatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'll help you create a custom tool for your agent. What would you like your tool to do? For example:\n\n- \"Create a tool that sends emails\"\n- \"I need a tool to fetch weather data\"\n- \"Build a tool that searches a database\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [generatedTool, setGeneratedTool] = useState<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  } | null>(null);

  const generateMutation = trpc.aiAssistant.generateTool.useMutation({
    onSuccess: (data: { message: string; toolSpec: { name: string; description: string; parameters: Record<string, unknown> } | null }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.toolSpec) {
        setGeneratedTool(data.toolSpec);
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
    });
  };

  const handleAccept = () => {
    if (generatedTool) {
      onToolGenerated(generatedTool);
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
          <CardTitle>AI Tool Creator</CardTitle>
        </div>
        <CardDescription>
          Describe what you want your tool to do, and I'll help you create it
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

        {/* Generated Tool Preview */}
        {generatedTool && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Tool Generated!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span> {generatedTool.name}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{" "}
                {generatedTool.description}
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold">
                  View Parameters Schema
                </summary>
                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                  {JSON.stringify(generatedTool.parameters, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder="Describe your tool..."
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
          {generatedTool && (
            <Button onClick={handleAccept} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Use This Tool
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
