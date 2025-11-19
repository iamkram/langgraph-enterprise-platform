import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentFormStore } from "@/stores/agentFormStore";
import { Plus, X, Wrench } from "lucide-react";
import { useState } from "react";

const PREDEFINED_TOOLS = [
  {
    name: "search_financial_data",
    description: "Search for financial data for a given company symbol",
    parameters: { symbol: "string", metric: "string" }
  },
  {
    name: "analyze_sentiment",
    description: "Analyze sentiment of text content",
    parameters: { text: "string" }
  },
  {
    name: "calculate_risk_metrics",
    description: "Calculate risk metrics from financial data",
    parameters: { data: "object" }
  },
];

export default function Step3ToolSelection() {
  const { tools, addTool, removeTool } = useAgentFormStore();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTool, setCustomTool] = useState({
    name: "",
    description: "",
    parameters: "{}"
  });
  
  const handleAddCustomTool = () => {
    if (customTool.name.trim() && customTool.description.trim()) {
      try {
        const params = JSON.parse(customTool.parameters);
        addTool({
          name: customTool.name.trim(),
          description: customTool.description.trim(),
          parameters: params
        });
        setCustomTool({ name: "", description: "", parameters: "{}" });
        setShowCustomForm(false);
      } catch (e) {
        alert("Invalid JSON for parameters");
      }
    }
  };
  
  const isToolSelected = (toolName: string) => {
    return tools.some(t => t.name === toolName);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <Label>Predefined Tools</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Select from common tools for your agents
        </p>
        <div className="grid grid-cols-1 gap-4">
          {PREDEFINED_TOOLS.map((tool) => {
            const isSelected = isToolSelected(tool.name);
            return (
              <Card
                key={tool.name}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
                onClick={() => {
                  if (isSelected) {
                    removeTool(tool.name);
                  } else {
                    addTool(tool);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      {tool.name}
                    </CardTitle>
                    {isSelected && <Badge variant="default">Selected</Badge>}
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Parameters:</span>{" "}
                    {JSON.stringify(tool.parameters)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Custom Tools</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomForm(!showCustomForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Tool
          </Button>
        </div>
        
        {showCustomForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Define Custom Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tool-name">Tool Name *</Label>
                <Input
                  id="tool-name"
                  placeholder="e.g., fetch_market_data"
                  value={customTool.name}
                  onChange={(e) => setCustomTool({ ...customTool, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tool-description">Description *</Label>
                <Textarea
                  id="tool-description"
                  placeholder="Describe what this tool does..."
                  value={customTool.description}
                  onChange={(e) => setCustomTool({ ...customTool, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="tool-parameters">Parameters (JSON) *</Label>
                <Textarea
                  id="tool-parameters"
                  placeholder='{"param1": "string", "param2": "number"}'
                  value={customTool.parameters}
                  onChange={(e) => setCustomTool({ ...customTool, parameters: e.target.value })}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddCustomTool}>Add Tool</Button>
                <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {tools.length > 0 && (
        <div>
          <Label>Selected Tools ({tools.length})</Label>
          <div className="space-y-2 mt-2">
            {tools.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTool(tool.name)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
