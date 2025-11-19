import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAgentFormStore } from "@/stores/agentFormStore";
import { step1Schema } from "@shared/agentValidation";
import { useState } from "react";

export default function Step1BasicInfo() {
  const { name, description, agentType, setName, setDescription, setAgentType } = useAgentFormStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateField = (field: string, value: any) => {
    try {
      step1Schema.shape[field as keyof typeof step1Schema.shape].parse(value);
      setErrors(prev => ({ ...prev, [field]: "" }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [field]: err.errors[0]?.message || "Invalid" }));
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Financial Analysis Agent"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            validateField("name", e.target.value);
          }}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            A descriptive name for your agent
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what your agent does..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Optional description of the agent's purpose and capabilities
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Agent Type *</Label>
        <RadioGroup value={agentType} onValueChange={(value) => setAgentType(value as any)}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="supervisor" id="supervisor" />
            <div className="flex-1">
              <Label htmlFor="supervisor" className="cursor-pointer font-medium">
                Supervisor Agent
              </Label>
              <p className="text-sm text-muted-foreground">
                Orchestrates multiple worker agents with routing logic
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="worker" id="worker" />
            <div className="flex-1">
              <Label htmlFor="worker" className="cursor-pointer font-medium">
                Worker Agent
              </Label>
              <p className="text-sm text-muted-foreground">
                Specialized agent with specific tools and capabilities
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="custom" id="custom" />
            <div className="flex-1">
              <Label htmlFor="custom" className="cursor-pointer font-medium">
                Custom Agent
              </Label>
              <p className="text-sm text-muted-foreground">
                Build a custom agent with your own configuration
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
