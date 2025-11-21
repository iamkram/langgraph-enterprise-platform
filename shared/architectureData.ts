export interface ComponentDetail {
  id: string;
  name: string;
  layer: string;
  type: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  dependencies: string[];
  metrics?: {
    latency?: string;
    throughput?: string;
    errorRate?: string;
    availability?: string;
    capacity?: string;
    durability?: string;
    cost?: string;
    accuracy?: string;
  };
  endpoints?: string[];
  documentation?: string;
}

export const architectureComponents: Record<string, ComponentDetail> = {
  // Client Layer
  "react-ui": {
    id: "react-ui",
    name: "React UI",
    layer: "Client Layer",
    type: "Frontend Application",
    description: "Main user interface built with React 19, providing the agent creation wizard, templates gallery, and analytics dashboard.",
    responsibilities: [
      "Render 5-step wizard for agent creation",
      "Display agent templates gallery",
      "Show analytics dashboards and metrics",
      "Handle user authentication flow",
      "Provide code preview with syntax highlighting"
    ],
    technologies: ["React 19", "TypeScript", "Tailwind CSS 4", "Wouter (routing)", "shadcn/ui"],
    dependencies: ["trpc-api", "zustand-store"],
    metrics: {
      latency: "< 100ms (TTI)",
      availability: "99.9%"
    },
    documentation: "See /docs/frontend-architecture.md"
  },
  
  "templates-gallery": {
    id: "templates-gallery",
    name: "Templates Gallery",
    layer: "Client Layer",
    type: "UI Component",
    description: "Browse and clone pre-configured agent templates for quick setup.",
    responsibilities: [
      "Display 5 reference agent templates",
      "Show template details and code previews",
      "Enable one-click template cloning",
      "Pre-fill wizard form from template data"
    ],
    technologies: ["React", "Zustand", "shadcn/ui Card components"],
    dependencies: ["react-ui", "agent-form-store"],
    documentation: "See /client/src/pages/Templates.tsx"
  },

  "wizard": {
    id: "wizard",
    name: "5-Step Wizard",
    layer: "Client Layer",
    type: "UI Component",
    description: "Multi-step form for creating custom agents with validation.",
    responsibilities: [
      "Step 1: Collect basic agent information",
      "Step 2: Configure worker agents",
      "Step 3: Select and configure tools",
      "Step 4: Set security settings",
      "Step 5: Review and generate code"
    ],
    technologies: ["React", "Zustand", "Zod validation", "shadcn/ui Form"],
    dependencies: ["react-ui", "validation-schemas"],
    metrics: {
      latency: "< 50ms per step"
    },
    documentation: "See /client/src/components/wizard/"
  },

  "test-run-dialog": {
    id: "test-run-dialog",
    name: "Test Run Dialog",
    layer: "Client Layer",
    type: "UI Component",
    description: "Execute agents with sample inputs and view real-time results.",
    responsibilities: [
      "Provide input form for test execution",
      "Display execution steps in real-time",
      "Show token usage and cost estimates",
      "Render execution results with formatting"
    ],
    technologies: ["React", "tRPC", "shadcn/ui Dialog"],
    dependencies: ["react-ui", "execution-api"],
    documentation: "See /client/src/components/TestRunDialog.tsx"
  },

  // API Layer
  "trpc-api": {
    id: "trpc-api",
    name: "tRPC API Gateway",
    layer: "API Layer",
    type: "API Gateway",
    description: "Type-safe API gateway providing end-to-end type safety between client and server.",
    responsibilities: [
      "Route requests to appropriate handlers",
      "Validate request/response schemas",
      "Handle authentication context",
      "Provide automatic type inference",
      "Serialize complex types (Date, BigInt)"
    ],
    technologies: ["tRPC 11", "Zod", "Superjson"],
    dependencies: ["auth-handler", "agent-api", "execution-api", "analytics-api", "search-api"],
    metrics: {
      latency: "< 10ms (routing overhead)",
      throughput: "1000+ req/s",
      errorRate: "< 0.1%"
    },
    endpoints: [
      "/api/trpc/auth.*",
      "/api/trpc/agents.*",
      "/api/trpc/execution.*",
      "/api/trpc/analytics.*",
      "/api/trpc/search.*"
    ],
    documentation: "See /server/routers.ts"
  },

  "auth-handler": {
    id: "auth-handler",
    name: "OAuth Handler",
    layer: "API Layer",
    type: "Authentication Service",
    description: "Handles Manus OAuth authentication flow and session management.",
    responsibilities: [
      "Process OAuth callbacks",
      "Create and validate sessions",
      "Manage session cookies",
      "Provide user context to procedures"
    ],
    technologies: ["OAuth 2.0", "JWT", "HTTP-only cookies"],
    dependencies: ["database"],
    metrics: {
      latency: "< 200ms",
      availability: "99.99%"
    },
    documentation: "See /server/_core/auth.ts"
  },

  "agent-api": {
    id: "agent-api",
    name: "Agent CRUD API",
    layer: "API Layer",
    type: "REST-like API",
    description: "CRUD operations for agent configurations.",
    responsibilities: [
      "Create new agent configurations",
      "List user's agents",
      "Get agent details",
      "Update agent configurations",
      "Delete agents"
    ],
    technologies: ["tRPC", "Zod validation"],
    dependencies: ["code-generator", "validation", "database"],
    metrics: {
      latency: "< 500ms (p95)",
      throughput: "100+ req/s"
    },
    endpoints: [
      "agents.create",
      "agents.list",
      "agents.get",
      "agents.update",
      "agents.delete"
    ],
    documentation: "See /server/routers.ts"
  },

  "execution-api": {
    id: "execution-api",
    name: "Execution API",
    layer: "API Layer",
    type: "Execution Service",
    description: "Execute agents with test inputs and return results.",
    responsibilities: [
      "Load agent configuration",
      "Execute agent with input",
      "Track execution steps",
      "Calculate token usage and costs",
      "Return formatted results"
    ],
    technologies: ["tRPC", "OpenAI API"],
    dependencies: ["agent-executor", "security-layer", "database"],
    metrics: {
      latency: "< 10s (p95)",
      throughput: "100+ concurrent executions"
    },
    documentation: "See /server/execution.ts"
  },

  // Business Logic Layer
  "code-generator": {
    id: "code-generator",
    name: "Code Generator",
    layer: "Business Logic",
    type: "Code Generation Service",
    description: "Generates production-ready LangGraph code from agent configurations.",
    responsibilities: [
      "Generate supervisor agent code",
      "Generate worker agent code",
      "Generate state management code",
      "Generate workflow orchestration code",
      "Generate complete integrated code"
    ],
    technologies: ["TypeScript", "Template literals", "AST manipulation"],
    dependencies: ["validation", "database", "s3-storage"],
    metrics: {
      latency: "< 2s",
      throughput: "50+ generations/s"
    },
    documentation: "See /server/codeGeneration.ts"
  },

  "security-layer": {
    id: "security-layer",
    name: "Security Layer",
    layer: "Business Logic",
    type: "Security Service",
    description: "3-layer security architecture for PII detection and jailbreak prevention.",
    responsibilities: [
      "Layer 1a: Detect PII with Presidio",
      "Layer 1b: Prevent jailbreaks with NeMo Guardrails",
      "Layer 3: Validate outputs for PII leaks",
      "Redact or reject sensitive content",
      "Log security events"
    ],
    technologies: ["Presidio", "NeMo Guardrails", "OpenAI API"],
    dependencies: ["openai-api"],
    metrics: {
      latency: "< 2s",
      accuracy: "85-95% PII detection, 90%+ jailbreak prevention"
    },
    documentation: "See Phase 1 implementation"
  },

  "agent-executor": {
    id: "agent-executor",
    name: "Agent Executor",
    layer: "Business Logic",
    type: "Execution Engine",
    description: "Simulates agent execution with LLM-based supervisor and worker pattern.",
    responsibilities: [
      "Load agent configuration",
      "Simulate supervisor routing",
      "Execute worker agents",
      "Track execution steps",
      "Calculate costs and metrics"
    ],
    technologies: ["OpenAI API", "LangSmith"],
    dependencies: ["security-layer", "openai-api", "database"],
    metrics: {
      latency: "5-10s per execution",
      throughput: "100+ concurrent executions"
    },
    documentation: "See /server/execution.ts"
  },

  // Data Layer
  "database": {
    id: "database",
    name: "MySQL Database",
    layer: "Data Layer",
    type: "Relational Database",
    description: "Primary data store for agent configurations, usage logs, and analytics.",
    responsibilities: [
      "Store user profiles",
      "Store agent configurations",
      "Store generated code metadata",
      "Store usage logs",
      "Store analytics metrics"
    ],
    technologies: ["MySQL 8.0", "Drizzle ORM"],
    dependencies: [],
    metrics: {
      latency: "< 10ms (indexed queries)",
      availability: "99.95% (Multi-AZ)",
      capacity: "100GB+ storage"
    },
    documentation: "See /drizzle/schema.ts"
  },

  "s3-storage": {
    id: "s3-storage",
    name: "S3 Storage",
    layer: "Data Layer",
    type: "Object Storage",
    description: "Stores generated code files with versioning.",
    responsibilities: [
      "Store generated Python code",
      "Enable versioning for code history",
      "Provide pre-signed URLs for access",
      "Archive old versions to Glacier"
    ],
    technologies: ["AWS S3", "S3 Versioning"],
    dependencies: [],
    metrics: {
      latency: "< 100ms",
      availability: "99.99%",
      durability: "99.999999999%"
    },
    documentation: "See /server/storage.ts"
  },

  // External Services
  "jira-api": {
    id: "jira-api",
    name: "Jira API",
    layer: "External Services",
    type: "Issue Tracking",
    description: "Jira Cloud integration for approval workflows.",
    responsibilities: [
      "Create approval issues",
      "Receive webhook notifications",
      "Verify HMAC signatures",
      "Sync approval status"
    ],
    technologies: ["Jira REST API", "HMAC-SHA256"],
    dependencies: [],
    metrics: {
      latency: "< 1s",
      availability: "99.9% (Jira SLA)"
    },
    documentation: "See /server/jira/"
  },

  "openai-api": {
    id: "openai-api",
    name: "OpenAI API",
    layer: "External Services",
    type: "LLM Service",
    description: "OpenAI API for LLM execution and agent simulation.",
    responsibilities: [
      "Execute supervisor routing",
      "Execute worker agents",
      "Generate responses",
      "Calculate token usage"
    ],
    technologies: ["OpenAI GPT-4", "GPT-3.5 Turbo"],
    dependencies: [],
    metrics: {
      latency: "1-5s per call",
      availability: "99.9%",
      cost: "$0.01-0.03 per 1K tokens"
    },
    documentation: "See /server/_core/llm.ts"
  },

  "langsmith": {
    id: "langsmith",
    name: "LangSmith",
    layer: "External Services",
    type: "Observability Platform",
    description: "LangSmith for tracing, monitoring, and cost tracking.",
    responsibilities: [
      "Trace agent executions",
      "Track token usage",
      "Calculate costs",
      "Monitor performance",
      "Identify errors"
    ],
    technologies: ["LangSmith SDK"],
    dependencies: [],
    metrics: {
      latency: "< 100ms (async)",
      availability: "99.9%"
    },
    documentation: "See /docs/LANGSMITH_INTEGRATION.md"
  },

  // Infrastructure
  "alb": {
    id: "alb",
    name: "Application Load Balancer",
    layer: "Infrastructure",
    type: "Load Balancer",
    description: "Distributes traffic across ECS tasks with health checks.",
    responsibilities: [
      "Route HTTPS traffic to ECS tasks",
      "Perform health checks",
      "SSL/TLS termination",
      "Multi-AZ distribution"
    ],
    technologies: ["AWS ALB", "SSL/TLS"],
    dependencies: ["ecs-cluster"],
    metrics: {
      latency: "< 10ms",
      throughput: "1000+ req/s",
      availability: "99.99%"
    },
    documentation: "See /terraform/modules/alb/"
  },

  "ecs-cluster": {
    id: "ecs-cluster",
    name: "ECS Fargate Cluster",
    layer: "Infrastructure",
    type: "Container Orchestration",
    description: "Serverless container platform running the application.",
    responsibilities: [
      "Run application containers",
      "Auto-scale based on CPU/memory",
      "Health monitoring",
      "Blue-green deployments"
    ],
    technologies: ["AWS ECS Fargate", "Docker"],
    dependencies: ["rds-database", "s3-storage"],
    metrics: {
      latency: "N/A",
      availability: "99.95%",
      capacity: "2-10 tasks"
    },
    documentation: "See /terraform/modules/ecs/"
  },

  "rds-database": {
    id: "rds-database",
    name: "RDS PostgreSQL",
    layer: "Infrastructure",
    type: "Managed Database",
    description: "Multi-AZ PostgreSQL database with automated backups.",
    responsibilities: [
      "Store application data",
      "Automatic failover",
      "Automated backups",
      "Point-in-time recovery"
    ],
    technologies: ["AWS RDS", "PostgreSQL 15", "pgvector"],
    dependencies: [],
    metrics: {
      latency: "< 5ms",
      availability: "99.95% (Multi-AZ)",
      capacity: "100GB+ storage"
    },
    documentation: "See /terraform/modules/rds/"
  }
};

export const diagramHotspots = {
  "system-architecture": [
    { id: "react-ui", x: 150, y: 50, width: 200, height: 80 },
    { id: "templates-gallery", x: 150, y: 140, width: 200, height: 60 },
    { id: "wizard", x: 150, y: 210, width: 200, height: 60 },
    { id: "test-run-dialog", x: 150, y: 280, width: 200, height: 60 },
    { id: "trpc-api", x: 150, y: 400, width: 200, height: 80 },
    { id: "code-generator", x: 150, y: 550, width: 200, height: 80 },
    { id: "security-layer", x: 150, y: 640, width: 200, height: 80 },
    { id: "database", x: 150, y: 800, width: 200, height: 80 },
    { id: "s3-storage", x: 400, y: 800, width: 200, height: 80 },
  ],
  "deployment-architecture": [
    { id: "alb", x: 200, y: 150, width: 180, height: 60 },
    { id: "ecs-cluster", x: 200, y: 300, width: 180, height: 100 },
    { id: "rds-database", x: 200, y: 500, width: 180, height: 80 },
  ]
};
