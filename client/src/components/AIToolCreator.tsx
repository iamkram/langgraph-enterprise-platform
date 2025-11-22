import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles, CheckCircle2, Save, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const saveToLibraryMutation = trpc.library.saveTool.useMutation({
    onSuccess: () => {
      toast.success("Tool saved to library!");
      setShowSaveOptions(false);
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

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

  const handleSaveToLibrary = () => {
    if (!generatedTool) return;

    saveToLibraryMutation.mutate({
      name: generatedTool.name,
      description: generatedTool.description,
      parameters: JSON.stringify(generatedTool.parameters),
      isPublic,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
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

        {/* Save to Library Options */}
        {generatedTool && showSaveOptions && (
          <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookmarkPlus className="h-5 w-5" />
                Save to Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="public-toggle">Make this tool public</Label>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isPublic
                  ? "Other users can discover and use this tool"
                  : "Only you can see and use this tool"}
              </p>

              {/* Tags Input */}
              <div className="space-y-2">
                <Label>Tags (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button onClick={handleAddTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveOptions(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveToLibrary}
                  disabled={saveToLibraryMutation.isPending}
                  className="gap-2"
                >
                  {saveToLibraryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save to Library
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {generatedTool && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowSaveOptions(!showSaveOptions)}
                className="gap-2"
              >
                <BookmarkPlus className="h-4 w-4" />
                Save to Library
              </Button>
              <Button onClick={handleAccept} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Use This Tool
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
