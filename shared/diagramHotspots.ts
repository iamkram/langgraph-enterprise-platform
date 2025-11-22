/**
 * Hotspot data for interactive architecture diagrams
 * Coordinates are percentage-based (0-100) relative to diagram dimensions
 */

export interface DiagramHotspot {
  id: string;
  componentId: string; // References architectureData component
  position: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
  };
  label: string;
  description: string;
  technologies?: string[];
  keyFeatures?: string[];
}

export interface DiagramHotspots {
  [diagramId: string]: DiagramHotspot[];
}

export const diagramHotspots: DiagramHotspots = {
  "system": [
    {
      id: "system-react-ui",
      componentId: "react-ui",
      position: { x: 15, y: 15 },
      label: "React UI",
      description: "Modern React 19 frontend with TypeScript, providing a responsive and type-safe user interface for agent management.",
      technologies: ["React 19", "TypeScript", "Tailwind CSS 4"],
      keyFeatures: ["Type-safe components", "Responsive design", "Real-time updates"]
    },
    {
      id: "system-wizard",
      componentId: "wizard",
      position: { x: 30, y: 15 },
      label: "5-Step Wizard",
      description: "Guided agent creation flow with validation at each step, making it easy to configure complex agent setups.",
      technologies: ["React", "Zod validation"],
      keyFeatures: ["Step-by-step guidance", "Real-time validation", "Progress tracking"]
    },
    {
      id: "system-templates",
      componentId: "templates",
      position: { x: 45, y: 15 },
      label: "Templates Gallery",
      description: "Pre-built agent templates for common use cases, accelerating development with proven patterns.",
      technologies: ["React", "Template engine"],
      keyFeatures: ["Quick start templates", "Customizable configs", "Best practices"]
    },
    {
      id: "system-trpc",
      componentId: "trpc-api",
      position: { x: 50, y: 35 },
      label: "tRPC Gateway",
      description: "Type-safe API gateway providing end-to-end type safety with automatic validation and serialization.",
      technologies: ["tRPC 11", "Zod", "Superjson"],
      keyFeatures: ["End-to-end types", "Auto validation", "Complex type support"]
    },
    {
      id: "system-oauth",
      componentId: "auth-handler",
      position: { x: 25, y: 35 },
      label: "OAuth Handler",
      description: "Secure authentication using Manus OAuth with JWT tokens and HTTP-only cookies for session management.",
      technologies: ["OAuth 2.0", "JWT", "Cookies"],
      keyFeatures: ["Secure sessions", "Auto refresh", "User context"]
    },
    {
      id: "system-agent-crud",
      componentId: "agent-api",
      position: { x: 30, y: 55 },
      label: "Agent CRUD",
      description: "Complete agent lifecycle management with create, read, update, and delete operations.",
      technologies: ["tRPC", "Zod"],
      keyFeatures: ["Full CRUD", "Validation", "Authorization"]
    },
    {
      id: "system-codegen",
      componentId: "code-generator",
      position: { x: 45, y: 55 },
      label: "Code Generator",
      description: "Generates production-ready LangGraph Python code from agent configurations using LLM-powered templates.",
      technologies: ["OpenAI API", "Templates"],
      keyFeatures: ["LLM-powered", "Template-based", "Version control"]
    },
    {
      id: "system-execution",
      componentId: "agent-executor",
      position: { x: 60, y: 55 },
      label: "Execution Engine",
      description: "Runs agent test executions with checkpointing, tracking token usage and costs in real-time.",
      technologies: ["LangGraph", "OpenAI"],
      keyFeatures: ["Checkpointing", "Cost tracking", "Step tracing"]
    },
    {
      id: "system-mysql",
      componentId: "database",
      position: { x: 50, y: 75 },
      label: "MySQL/TiDB",
      description: "Relational database storing agent configurations, execution history, and analytics data.",
      technologies: ["MySQL 8", "TiDB"],
      keyFeatures: ["ACID compliance", "High availability", "Scalable"]
    },
    {
      id: "system-s3",
      componentId: "s3-storage",
      position: { x: 70, y: 75 },
      label: "S3 Storage",
      description: "Object storage for generated code files with versioning and lifecycle management.",
      technologies: ["AWS S3"],
      keyFeatures: ["Versioning", "Lifecycle rules", "High durability"]
    }
  ],
  
  "data-flow": [
    {
      id: "dataflow-user",
      componentId: "react-ui",
      position: { x: 10, y: 10 },
      label: "User Request",
      description: "User initiates agent creation through the React UI, triggering the complete workflow.",
      keyFeatures: ["Form validation", "Real-time feedback", "Error handling"]
    },
    {
      id: "dataflow-trpc",
      componentId: "trpc-api",
      position: { x: 30, y: 10 },
      label: "tRPC Gateway",
      description: "Routes the request to the appropriate handler with automatic type checking and validation.",
      keyFeatures: ["Type safety", "Auto serialization", "Error mapping"]
    },
    {
      id: "dataflow-auth",
      componentId: "auth-handler",
      position: { x: 50, y: 10 },
      label: "Auth Validation",
      description: "Validates user session and injects user context into the request for authorization.",
      keyFeatures: ["JWT validation", "Session refresh", "User context"]
    },
    {
      id: "dataflow-db-insert",
      componentId: "database",
      position: { x: 50, y: 40 },
      label: "Database Insert",
      description: "Stores agent configuration in a transaction, ensuring data consistency.",
      keyFeatures: ["ACID transactions", "Foreign keys", "Rollback on error"]
    },
    {
      id: "dataflow-codegen",
      componentId: "code-generator",
      position: { x: 50, y: 60 },
      label: "Code Generation",
      description: "Generates Python code using LLM with agent-specific templates and configurations.",
      keyFeatures: ["Template merging", "LLM enhancement", "Syntax validation"]
    },
    {
      id: "dataflow-s3-store",
      componentId: "s3-storage",
      position: { x: 70, y: 60 },
      label: "S3 Storage",
      description: "Stores generated code files with versioning for rollback and audit trail.",
      keyFeatures: ["Version control", "Immutable storage", "Fast retrieval"]
    }
  ],
  
  "deployment": [
    {
      id: "deploy-cloudfront",
      componentId: "cloudfront",
      position: { x: 20, y: 15 },
      label: "CloudFront CDN",
      description: "Global content delivery network caching static assets at edge locations for low latency.",
      technologies: ["AWS CloudFront"],
      keyFeatures: ["Edge caching", "SSL/TLS", "DDoS protection"]
    },
    {
      id: "deploy-alb",
      componentId: "alb",
      position: { x: 50, y: 35 },
      label: "Load Balancer",
      description: "Distributes traffic across multiple ECS containers with health checks and auto-scaling.",
      technologies: ["AWS ALB"],
      keyFeatures: ["Health checks", "SSL termination", "Path routing"]
    },
    {
      id: "deploy-ecs",
      componentId: "ecs-fargate",
      position: { x: 50, y: 50 },
      label: "ECS Fargate",
      description: "Serverless container orchestration running tRPC servers with auto-scaling based on load.",
      technologies: ["AWS ECS", "Fargate"],
      keyFeatures: ["Auto-scaling", "Zero downtime", "Resource isolation"]
    },
    {
      id: "deploy-rds",
      componentId: "database",
      position: { x: 30, y: 70 },
      label: "RDS Multi-AZ",
      description: "Managed MySQL database with automatic failover and automated backups.",
      technologies: ["AWS RDS", "MySQL 8"],
      keyFeatures: ["Multi-AZ", "Auto backups", "Read replicas"]
    },
    {
      id: "deploy-elasticache",
      componentId: "elasticache",
      position: { x: 50, y: 70 },
      label: "ElastiCache",
      description: "In-memory session store for fast session lookups and reduced database load.",
      technologies: ["AWS ElastiCache", "Redis"],
      keyFeatures: ["Sub-ms latency", "Persistence", "Clustering"]
    },
    {
      id: "deploy-cloudwatch",
      componentId: "cloudwatch",
      position: { x: 70, y: 70 },
      label: "CloudWatch",
      description: "Centralized logging and monitoring with custom metrics and alarms.",
      technologies: ["AWS CloudWatch"],
      keyFeatures: ["Log aggregation", "Custom metrics", "Alarms"]
    }
  ],
  
  "security": [
    {
      id: "security-oauth",
      componentId: "auth-handler",
      position: { x: 50, y: 20 },
      label: "OAuth Layer",
      description: "First line of defense validating JWT tokens from Manus OAuth provider.",
      technologies: ["OAuth 2.0", "JWT"],
      keyFeatures: ["Token validation", "Expiry checks", "Signature verification"]
    },
    {
      id: "security-session",
      componentId: "session-store",
      position: { x: 50, y: 30 },
      label: "Session Cookie",
      description: "HTTP-only secure cookies preventing XSS attacks and CSRF with SameSite policy.",
      technologies: ["Cookies", "SameSite"],
      keyFeatures: ["HTTP-only", "Secure flag", "SameSite=strict"]
    },
    {
      id: "security-rbac",
      componentId: "rbac",
      position: { x: 50, y: 45 },
      label: "RBAC",
      description: "Role-based access control separating admin and user permissions at the procedure level.",
      technologies: ["Custom RBAC"],
      keyFeatures: ["Role checking", "Resource isolation", "Audit logging"]
    },
    {
      id: "security-zod",
      componentId: "validation",
      position: { x: 50, y: 60 },
      label: "Zod Validation",
      description: "Runtime type checking and validation preventing injection attacks and malformed data.",
      technologies: ["Zod"],
      keyFeatures: ["Schema validation", "Type coercion", "Custom validators"]
    },
    {
      id: "security-encryption",
      componentId: "encryption",
      position: { x: 30, y: 75 },
      label: "Encryption",
      description: "Data encrypted at rest in RDS and S3 with AWS KMS-managed keys.",
      technologies: ["AWS KMS", "AES-256"],
      keyFeatures: ["At-rest encryption", "Key rotation", "Compliance"]
    },
    {
      id: "security-logs",
      componentId: "cloudwatch",
      position: { x: 50, y: 85 },
      label: "Audit Logs",
      description: "All API calls logged to CloudWatch with user context for security auditing and compliance.",
      technologies: ["CloudWatch Logs"],
      keyFeatures: ["Immutable logs", "Retention policies", "Log insights"]
    }
  ],
  
  "execution": [
    {
      id: "exec-load",
      componentId: "agent-executor",
      position: { x: 50, y: 15 },
      label: "Load Config",
      description: "Retrieves agent configuration from database including tools, workers, and security settings.",
      keyFeatures: ["Config validation", "Permission check", "Version selection"]
    },
    {
      id: "exec-validate",
      componentId: "validation",
      position: { x: 50, y: 25 },
      label: "Validate Input",
      description: "Validates user input against agent schema, ensuring type safety and security.",
      keyFeatures: ["Schema validation", "Sanitization", "Type coercion"]
    },
    {
      id: "exec-state",
      componentId: "agent-executor",
      position: { x: 50, y: 35 },
      label: "Initialize State",
      description: "Creates AgentState TypedDict with messages, user input, and execution context.",
      keyFeatures: ["State initialization", "Context injection", "Checkpoint setup"]
    },
    {
      id: "exec-supervisor",
      componentId: "supervisor-agent",
      position: { x: 50, y: 50 },
      label: "Supervisor Node",
      description: "LLM-powered supervisor analyzes task and routes to appropriate worker agent.",
      technologies: ["GPT-4o", "LangGraph"],
      keyFeatures: ["Task analysis", "Worker routing", "Decision logging"]
    },
    {
      id: "exec-worker",
      componentId: "worker-agent",
      position: { x: 50, y: 65 },
      label: "Worker Node",
      description: "Executes specific tools (search, analyze, calculate) and returns results to supervisor.",
      technologies: ["LangGraph", "Custom tools"],
      keyFeatures: ["Tool execution", "Error handling", "Result formatting"]
    },
    {
      id: "exec-checkpoint",
      componentId: "checkpointing",
      position: { x: 50, y: 80 },
      label: "Save Checkpoint",
      description: "Persists execution state enabling resume, debugging, and audit trail.",
      technologies: ["LangGraph Checkpointing"],
      keyFeatures: ["State persistence", "Resume capability", "Audit trail"]
    }
  ]
};
