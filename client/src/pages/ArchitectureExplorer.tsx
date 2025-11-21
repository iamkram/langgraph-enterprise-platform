import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ExternalLink, Layers, Database, Cloud, Shield, Cpu, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { architectureComponents, type ComponentDetail } from "@shared/architectureData";

const diagrams = [
  {
    id: "system",
    name: "System Architecture",
    description: "Complete system overview with all layers",
    image: "/docs/diagrams/system-architecture.png",
    icon: Layers
  },
  {
    id: "data-flow",
    name: "Data Flow",
    description: "Request/response flow through the system",
    image: "/docs/diagrams/data-flow.png",
    icon: Database
  },
  {
    id: "deployment",
    name: "AWS Deployment",
    description: "Infrastructure and deployment topology",
    image: "/docs/diagrams/deployment-architecture.png",
    icon: Cloud
  },
  {
    id: "security",
    name: "Security Architecture",
    description: "3-layer security validation flow",
    image: "/docs/diagrams/security-architecture.png",
    icon: Shield
  },
  {
    id: "execution",
    name: "Agent Execution",
    description: "Agent workflow execution pattern",
    image: "/docs/diagrams/agent-execution-flow.png",
    icon: Cpu
  }
];

const layerColors: Record<string, string> = {
  "Client Layer": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "API Layer": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Business Logic": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Data Layer": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "External Services": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "Infrastructure": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
};

export default function ArchitectureExplorer() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const components = Object.values(architectureComponents);
  
  const filteredComponents = components.filter(comp => {
    const matchesSearch = searchQuery === "" || 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLayer = !selectedLayer || comp.layer === selectedLayer;
    
    return matchesSearch && matchesLayer;
  });

  const layers = Array.from(new Set(components.map(c => c.layer)));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Architecture Explorer</h1>
          <p className="text-muted-foreground">
            Interactive documentation for the Enterprise LangGraph Agent Scaffolding Platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Diagrams and Component List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Architecture Diagrams */}
            <Card>
              <CardHeader>
                <CardTitle>Architecture Diagrams</CardTitle>
                <CardDescription>
                  Explore different views of the system architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="system" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    {diagrams.map(diagram => {
                      const Icon = diagram.icon;
                      return (
                        <TabsTrigger key={diagram.id} value={diagram.id} className="flex items-center gap-1">
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{diagram.name.split(' ')[0]}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {diagrams.map(diagram => (
                    <TabsContent key={diagram.id} value={diagram.id} className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{diagram.name}</h3>
                          <p className="text-sm text-muted-foreground">{diagram.description}</p>
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                          <img 
                            src={diagram.image} 
                            alt={diagram.name}
                            className="w-full h-auto"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Click on components in the list below to see detailed information
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Component List */}
            <Card>
              <CardHeader>
                <CardTitle>System Components</CardTitle>
                <CardDescription>
                  Browse all {components.length} components in the architecture
                </CardDescription>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search components..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Layer Filter */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant={selectedLayer === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLayer(null)}
                  >
                    All Layers
                  </Button>
                  {layers.map(layer => (
                    <Button
                      key={layer}
                      variant={selectedLayer === layer ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLayer(layer)}
                    >
                      {layer}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {filteredComponents.map(component => (
                      <Card
                        key={component.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedComponent?.id === component.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedComponent(component)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{component.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {component.description}
                              </CardDescription>
                            </div>
                            <Badge className={layerColors[component.layer] || ""}>
                              {component.layer}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                    
                    {filteredComponents.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No components found matching your criteria</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Component Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {selectedComponent ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{selectedComponent.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {selectedComponent.type}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedComponent(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge className={`mt-2 w-fit ${layerColors[selectedComponent.layer] || ""}`}>
                      {selectedComponent.layer}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      <div className="space-y-6">
                        {/* Description */}
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedComponent.description}
                          </p>
                        </div>

                        {/* Responsibilities */}
                        <div>
                          <h4 className="font-semibold mb-2">Responsibilities</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {selectedComponent.responsibilities.map((resp, idx) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Technologies */}
                        <div>
                          <h4 className="font-semibold mb-2">Technologies</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedComponent.technologies.map((tech, idx) => (
                              <Badge key={idx} variant="secondary">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Dependencies */}
                        {selectedComponent.dependencies.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Dependencies</h4>
                            <div className="space-y-2">
                              {selectedComponent.dependencies.map((depId, idx) => {
                                const dep = architectureComponents[depId];
                                return dep ? (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => setSelectedComponent(dep)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-2" />
                                    {dep.name}
                                  </Button>
                                ) : (
                                  <Badge key={idx} variant="outline">{depId}</Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Metrics */}
                        {selectedComponent.metrics && (
                          <div>
                            <h4 className="font-semibold mb-2">Performance Metrics</h4>
                            <div className="space-y-2">
                              {Object.entries(selectedComponent.metrics).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Endpoints */}
                        {selectedComponent.endpoints && selectedComponent.endpoints.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">API Endpoints</h4>
                            <div className="space-y-1">
                              {selectedComponent.endpoints.map((endpoint, idx) => (
                                <code key={idx} className="block text-xs bg-muted px-2 py-1 rounded">
                                  {endpoint}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documentation */}
                        {selectedComponent.documentation && (
                          <div>
                            <h4 className="font-semibold mb-2">Documentation</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedComponent.documentation}
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <Layers className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Select a component</p>
                      <p className="text-sm mt-2">
                        Click on any component from the list to view detailed information
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
