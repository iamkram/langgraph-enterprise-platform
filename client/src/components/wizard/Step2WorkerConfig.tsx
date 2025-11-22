import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAgentFormStore } from "@/stores/agentFormStore";
import { Plus, X, Sparkles } from "lucide-react";
import { useState } from "react";
import AIAgentCreator from "@/components/AIAgentCreator";

const PREDEFINED_WORKERS = [
  { name: "researcher", description: "Gathers information and data" },
  { name: "analyst", description: "Analyzes data and generates insights" },
  { name: "writer", description: "Creates reports and summaries" },
];

export default function Step2WorkerConfig() {
  const { workerAgents, addWorkerAgent, removeWorkerAgent, agentType, tools } = useAgentFormStore();
  const [customWorker, setCustomWorker] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  if (agentType !== 'supervisor') {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Worker configuration is only available for Supervisor agents.</p>
        <p className="text-sm mt-2">Skip to the next step to continue.</p>
      </div>
    );
  }
  
  const handleAddCustomWorker = () => {
    if (customWorker.trim() && !workerAgents.includes(customWorker.trim())) {
      addWorkerAgent(customWorker.trim());
      setCustomWorker("");
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <Label>Predefined Worker Agents</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Select from common worker agent types
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PREDEFINED_WORKERS.map((worker) => {
            const isSelected = workerAgents.includes(worker.name);
            return (
              <div
                key={worker.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10 border-primary" : "hover:bg-accent"
                }`}
                onClick={() => {
                  if (isSelected) {
                    removeWorkerAgent(worker.name);
                  } else {
                    addWorkerAgent(worker.name);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{worker.name}</h4>
                  {isSelected && <Badge variant="default">Selected</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{worker.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Add Custom Worker</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAIAssistant(true);
                setShowManualEntry(false);
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowManualEntry(!showManualEntry);
                setShowAIAssistant(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>
        </div>
        
        {showAIAssistant && (
          <AIAgentCreator
            availableTools={tools.map(t => t.name)}
            onAgentGenerated={(agentSpec) => {
              // For now, just add the agent name to the workers list
              // In a future enhancement, we could store the full agent spec
              addWorkerAgent(agentSpec.name);
              setShowAIAssistant(false);
            }}
            onCancel={() => setShowAIAssistant(false)}
          />
        )}
        
        {showManualEntry && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">
              Add your own custom worker agent
            </p>
            <div className="flex gap-2">
              <Input
                id="custom-worker"
                placeholder="e.g., data_processor"
                value={customWorker}
                onChange={(e) => setCustomWorker(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomWorker();
                  }
                }}
              />
              <Button onClick={handleAddCustomWorker} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {workerAgents.length > 0 && (
        <div>
          <Label>Selected Workers ({workerAgents.length})</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {workerAgents.map((worker) => (
              <Badge key={worker} variant="secondary" className="text-sm py-1 px-3">
                {worker}
                <button
                  onClick={() => removeWorkerAgent(worker)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
