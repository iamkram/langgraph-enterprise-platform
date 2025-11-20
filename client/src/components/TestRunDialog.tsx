import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Play, Loader2, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestRunDialogProps {
  agentConfig: any;
  agentId?: number;
}

export default function TestRunDialog({ agentConfig, agentId }: TestRunDialogProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);

  const executeMutation = trpc.execution.execute.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (!data.success) {
        toast.error("Execution failed: " + data.error);
      } else {
        toast.success("Execution completed successfully!");
      }
    },
    onError: (error) => {
      toast.error("Failed to execute agent: " + error.message);
    },
  });

  const { data: sampleInputs } = trpc.execution.getSampleInputs.useQuery({
    agentType: agentConfig.agentType || "general",
  });

  const handleExecute = () => {
    if (!input.trim()) {
      toast.error("Please enter an input");
      return;
    }

    setResult(null);
    executeMutation.mutate({
      agentId,
      config: agentConfig,
      input: input.trim(),
    });
  };

  const useSampleInput = (sample: string) => {
    setInput(sample);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Test Run
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Run Agent</DialogTitle>
          <DialogDescription>
            Execute your agent with sample input to see how it performs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="input">Input</Label>
            <Textarea
              id="input"
              placeholder="Enter your test input here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              className="resize-none"
            />
            
            {/* Sample Inputs */}
            {sampleInputs && sampleInputs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Sample Inputs:</Label>
                <div className="flex flex-wrap gap-2">
                  {sampleInputs.map((sample, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => useSampleInput(sample)}
                      className="text-xs"
                    >
                      {sample.length > 50 ? sample.substring(0, 50) + "..." : sample}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleExecute}
            disabled={executeMutation.isPending || !input.trim()}
            className="w-full"
          >
            {executeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Agent
              </>
            )}
          </Button>

          {/* Results Section */}
          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Execution Result</h3>
                {result.success ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Execution Time</p>
                        <p className="text-sm font-medium">{result.metadata.executionTime}ms</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {result.metadata.tokensUsed && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">🔢</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Tokens Used</p>
                          <p className="text-sm font-medium">{result.metadata.tokensUsed.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {result.metadata.cost && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Estimated Cost</p>
                          <p className="text-sm font-medium">${result.metadata.cost.toFixed(4)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Execution Steps */}
              {result.steps && result.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Execution Steps</h4>
                  <div className="space-y-2">
                    {result.steps.map((step: any, idx: number) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-0.5">
                              Step {step.step}
                            </Badge>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{step.worker}</span>
                                <span className="text-xs text-muted-foreground">→ {step.action}</span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {step.output}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Output */}
              {result.output && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Final Output</h4>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">{result.output}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-destructive">Error</h4>
                  <Card className="border-destructive">
                    <CardContent className="pt-4">
                      <p className="text-sm text-destructive">{result.error}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
