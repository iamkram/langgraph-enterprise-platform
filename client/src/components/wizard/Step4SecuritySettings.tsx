import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgentFormStore } from "@/stores/agentFormStore";
import { SmartTagSuggestions } from "@/components/SmartTagSuggestions";

export default function Step4SecuritySettings() {
  const {
    name,
    description,
    agentType,
    tools,
    securityEnabled,
    checkpointingEnabled,
    modelName,
    systemPrompt,
    maxIterations,
    maxRetries,
    setSecurityEnabled,
    setCheckpointingEnabled,
    setModelName,
    setSystemPrompt,
    setMaxIterations,
    setMaxRetries,
  } = useAgentFormStore();
  
  const handleApplyTags = (tagIds: number[]) => {
    // Tags will be applied when creating the agent
    console.log('Suggested tag IDs:', tagIds);
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Enable Security Layer</Label>
            <p className="text-sm text-muted-foreground">
              3-layer security with PII detection and guardrails
            </p>
          </div>
          <Switch
            checked={securityEnabled}
            onCheckedChange={setSecurityEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Enable Checkpointing</Label>
            <p className="text-sm text-muted-foreground">
              PostgreSQL-backed state persistence for resumability
            </p>
          </div>
          <Switch
            checked={checkpointingEnabled}
            onCheckedChange={setCheckpointingEnabled}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="model">Language Model</Label>
        <Select value={modelName} onValueChange={setModelName}>
          <SelectTrigger id="model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Choose the OpenAI model for your agent
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
        <Textarea
          id="system-prompt"
          placeholder="You are a helpful assistant specialized in..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Custom system prompt for your agent's behavior
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max-iterations">Max Iterations</Label>
          <Input
            id="max-iterations"
            type="number"
            min="1"
            max="100"
            value={maxIterations}
            onChange={(e) => setMaxIterations(parseInt(e.target.value) || 10)}
          />
          <p className="text-sm text-muted-foreground">
            Maximum routing iterations
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="max-retries">Max Retries</Label>
          <Input
            id="max-retries"
            type="number"
            min="0"
            max="10"
            value={maxRetries}
            onChange={(e) => setMaxRetries(parseInt(e.target.value) || 3)}
          />
          <p className="text-sm text-muted-foreground">
            Maximum error retries
          </p>
        </div>
      </div>
      
      {/* Smart Tag Suggestions */}
      <div className="space-y-2">
        <Label>Suggested Tags</Label>
        <p className="text-sm text-muted-foreground mb-2">
          AI-powered tag suggestions based on your agent configuration
        </p>
        <SmartTagSuggestions 
          agentName={name}
          agentDescription={description}
          agentType={agentType}
          tools={tools.map(t => t.name)}
          onApplyTags={handleApplyTags}
        />
      </div>
    </div>
  );
}
