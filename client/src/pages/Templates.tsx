import { useState } from "react";
import { useLocation } from "wouter";
import { agentTemplates, type AgentTemplate } from "@shared/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Sparkles, ArrowRight, Code2, CheckCircle2 } from "lucide-react";
import { useAgentFormStore } from "@/stores/agentFormStore";

export default function Templates() {
  const [, setLocation] = useLocation();
  const { loadFromTemplate } = useAgentFormStore();
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Templates", count: agentTemplates.length },
    { id: "financial", label: "Financial", count: agentTemplates.filter(t => t.category === "financial").length },
    { id: "customer-service", label: "Customer Service", count: agentTemplates.filter(t => t.category === "customer-service").length },
    { id: "research", label: "Research", count: agentTemplates.filter(t => t.category === "research").length },
    { id: "general", label: "General", count: agentTemplates.filter(t => t.category === "general").length },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? agentTemplates 
    : agentTemplates.filter(t => t.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleCloneTemplate = (template: AgentTemplate) => {
    loadFromTemplate(template);
    setLocation("/create-agent");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Agent Templates</h1>
              <p className="text-muted-foreground mt-2">
                Start with pre-configured templates and customize to your needs
              </p>
            </div>
            <Button onClick={() => setLocation("/create-agent")} variant="outline">
              Create from Scratch
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                {cat.label}
                <Badge variant="secondary" className="ml-1">{cat.count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {template.estimatedSetupTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      {template.config.workers.length} workers
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <p className="text-sm font-medium mb-2">Use Cases:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {template.useCases.slice(0, 2).map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <Code2 className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleCloneTemplate(template)}
                >
                  Clone Template
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found in this category.</p>
          </div>
        )}
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedTemplate?.icon}</span>
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {selectedTemplate && (
              <div className="space-y-6">
                {/* Configuration */}
                <div>
                  <h3 className="font-semibold mb-3">Configuration</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Agent Type</p>
                      <p className="text-sm">{selectedTemplate.config.agentType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Model</p>
                      <p className="text-sm">{selectedTemplate.config.model}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Workers</p>
                      <p className="text-sm">{selectedTemplate.config.workers.length} configured</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tools</p>
                      <p className="text-sm">{selectedTemplate.config.tools.length} tools</p>
                    </div>
                  </div>
                </div>

                {/* Workers */}
                <div>
                  <h3 className="font-semibold mb-3">Workers</h3>
                  <div className="space-y-2">
                    {selectedTemplate.config.workers.map((worker, idx) => (
                      <Card key={idx}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{worker.name}</CardTitle>
                          <CardDescription className="text-xs">{worker.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <h3 className="font-semibold mb-3">Tools</h3>
                  <div className="space-y-2">
                    {selectedTemplate.config.tools.map((tool, idx) => (
                      <Card key={idx}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{tool.name}</CardTitle>
                          <CardDescription className="text-xs">{tool.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h3 className="font-semibold mb-3">Use Cases</h3>
                  <ul className="space-y-2">
                    {selectedTemplate.useCases.map((useCase, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prerequisites */}
                <div>
                  <h3 className="font-semibold mb-3">Prerequisites</h3>
                  <ul className="space-y-2">
                    {selectedTemplate.prerequisites.map((prereq, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">•</span>
                        <span>{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Code Preview */}
                <div>
                  <h3 className="font-semibold mb-3">Code Preview</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{selectedTemplate.codePreview}</code>
                  </pre>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => selectedTemplate && handleCloneTemplate(selectedTemplate)}>
              Clone This Template
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
