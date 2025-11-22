import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAgentFormStore } from "@/stores/agentFormStore";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Step1BasicInfo from "@/components/wizard/Step1BasicInfo";
import Step2WorkerConfig from "@/components/wizard/Step2WorkerConfig";
import Step3ToolSelection from "@/components/wizard/Step3ToolSelection";
import Step4SecuritySettings from "@/components/wizard/Step4SecuritySettings";
import Step5Review from "@/components/wizard/Step5Review";
import { PageHeader } from "@/components/PageHeader";

const steps = [
  { number: 1, title: "Basic Information", description: "Agent name and type" },
  { number: 2, title: "Worker Configuration", description: "Select worker agents" },
  { number: 3, title: "Tool Selection", description: "Choose tools for agents" },
  { number: 4, title: "Security Settings", description: "Configure security and advanced options" },
  { number: 5, title: "Review & Generate", description: "Review and generate code" },
];

export default function CreateAgent() {
  const { currentStep, nextStep, previousStep, addWorkerAgent, addTool, ...formData } = useAgentFormStore();
  const [, setLocation] = useLocation();

  // Check for pending library items on mount
  useEffect(() => {
    // Check for pending agent from library
    const pendingAgent = sessionStorage.getItem("pendingAgent");
    if (pendingAgent) {
      try {
        const agent = JSON.parse(pendingAgent);
        // Add agent to worker list
        addWorkerAgent(agent);
        toast.success(`Added ${agent.name} from library!`);
        sessionStorage.removeItem("pendingAgent");
      } catch (error) {
        console.error("Failed to parse pending agent:", error);
      }
    }

    // Check for pending tool from library
    const pendingTool = sessionStorage.getItem("pendingTool");
    if (pendingTool) {
      try {
        const tool = JSON.parse(pendingTool);
        // Add tool to tools list
        addTool(tool);
        toast.success(`Added ${tool.name} from library!`);
        sessionStorage.removeItem("pendingTool");
      } catch (error) {
        console.error("Failed to parse pending tool:", error);
      }
    }
  }, [addWorkerAgent, addTool]);
  
  const createMutation = trpc.agents.create.useMutation({
    onSuccess: (data) => {
      toast.success("Agent created successfully!");
      setLocation(`/agent/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });
  
  const handleGenerate = () => {
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      agentType: formData.agentType,
      workerAgents: formData.workerAgents,
      tools: formData.tools,
      securityEnabled: formData.securityEnabled,
      checkpointingEnabled: formData.checkpointingEnabled,
      modelName: formData.modelName,
      systemPrompt: formData.systemPrompt,
      maxIterations: formData.maxIterations,
      maxRetries: formData.maxRetries,
    });
  };
  
  const progress = (currentStep / steps.length) * 100;
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        return <Step2WorkerConfig />;
      case 3:
        return <Step3ToolSelection />;
      case 4:
        return <Step4SecuritySettings />;
      case 5:
        return <Step5Review />;
      default:
        return <Step1BasicInfo />;
    }
  };
  
  const currentStepInfo = steps[currentStep - 1];
  
  return (
    <>
      <PageHeader
        title="Create New Agent"
        description="Build a LangGraph agent with our step-by-step wizard"
        breadcrumbs={[
          { label: "Create Agent" }
        ]}
      />
      <div className="container mx-auto py-8 max-w-4xl">
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center ${
                step.number < steps.length ? "flex-1" : ""
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step.number < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.number === currentStep
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-xs mt-2 text-center hidden md:block">
                  {step.title}
                </span>
              </div>
              {step.number < steps.length && (
                <div className="flex-1 h-1 mx-2 bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: step.number < currentStep ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="mt-4" />
      </div>
      
      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepInfo?.title}</CardTitle>
          <CardDescription>{currentStepInfo?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < 5 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleGenerate}
                disabled={createMutation.isPending || !formData.name}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Code
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
