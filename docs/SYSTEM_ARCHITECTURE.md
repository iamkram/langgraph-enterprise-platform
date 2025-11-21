# Enterprise LangGraph Agent Scaffolding Platform
## System Architecture Documentation

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Layers](#architecture-layers)
4. [Component Details](#component-details)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Monitoring & Observability](#monitoring--observability)
10. [Disaster Recovery](#disaster-recovery)

---

## Executive Summary

The Enterprise LangGraph Agent Scaffolding Platform is a production-grade system for creating, managing, and deploying LangGraph-based AI agents. The platform provides a complete workflow from agent design through approval, deployment, and monitoring, with enterprise-grade security, scalability, and observability.

### Key Capabilities

- **Form-Based Agent Creation**: 5-step wizard with validation and templates
- **Code Generation**: Automatic generation of production-ready LangGraph code
- **Security**: 3-layer security architecture (PII detection, guardrails, output validation)
- **Approval Workflow**: Jira integration with HMAC-verified webhooks
- **Agent Registry**: Semantic search with pgvector for agent discovery
- **Execution Engine**: Test run capability with real-time results
- **AWS Deployment**: ECS Fargate with blue-green deployment
- **Observability**: LangSmith integration for tracing and cost tracking

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS 4
- Zustand (state management)
- Zod (validation)
- tRPC (type-safe API)

**Backend:**
- Node.js + Express
- tRPC 11
- MySQL/TiDB (database)
- Drizzle ORM

**Infrastructure:**
- AWS ECS Fargate
- RDS PostgreSQL Multi-AZ
- Application Load Balancer
- S3 (code storage)
- CloudWatch (monitoring)
- CodeDeploy (blue-green deployment)

**External Services:**
- OpenAI API (LLM execution)
- LangSmith (tracing & cost tracking)
- Jira Cloud (approval workflow)

---

## System Overview

The platform follows a modern microservices-inspired architecture with clear separation of concerns across multiple layers. The system is designed for high availability, horizontal scalability, and enterprise security.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React UI │ Templates Gallery │ Wizard │ Test Run Dialog    │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC (Type-Safe API)
┌──────────────────────┴──────────────────────────────────────┐
│                        API Layer                             │
│  Auth │ Agent CRUD │ Execution │ Analytics │ Search         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   Business Logic Layer                       │
│  Code Gen │ Validation │ Security │ Executor │ Jira Client  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      Data Layer                              │
│  MySQL Database │ S3 Storage │ Redis Cache                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Client Layer

The client layer provides the user interface for all platform interactions.

**Components:**
- **React UI**: Main application shell with routing and layout
- **Templates Gallery**: Browse and clone pre-configured agent templates
- **5-Step Wizard**: Agent creation workflow with validation
- **Test Run Dialog**: Execute agents with sample inputs
- **Code Preview**: Syntax-highlighted code display with copy functionality
- **Analytics Dashboard**: Usage metrics and cost tracking

**State Management:**
- Zustand stores for form state
- tRPC React Query for server state
- Local storage for user preferences

**Validation:**
- Client-side validation with Zod schemas
- Real-time error feedback
- Progressive disclosure of complex fields

### 2. API Layer

The API layer exposes type-safe endpoints via tRPC.

**Routers:**
- **auth**: OAuth callback, session management, logout
- **agents**: CRUD operations for agent configurations
- **execution**: Test run execution with real-time results
- **analytics**: Usage metrics and cost tracking
- **search**: Semantic search for agent discovery
- **approval**: Jira integration and approval workflow

**Features:**
- Type-safe contracts between client and server
- Automatic request/response validation
- Built-in error handling
- Superjson for complex types (Date, BigInt, etc.)

### 3. Business Logic Layer

The business logic layer implements core platform functionality.

**Code Generator:**
- Generates 5 code artifacts per agent:
  - Supervisor code (LLM-powered routing)
  - Worker code (tool-equipped agents)
  - State code (schemas with reducers)
  - Workflow code (LangGraph orchestration)
  - Complete code (integrated implementation)
- Template-based generation with customization
- Syntax validation before storage

**Security Layer:**
- **Layer 1a**: Presidio PII detection with custom recognizers
- **Layer 1b**: NeMo Guardrails for jailbreak prevention
- **Layer 3**: Output validation for PII leaks
- Target: 85-95% PII detection, 90%+ jailbreak prevention
- Latency: <2 seconds per request

**Agent Executor:**
- LLM-based simulation of agent execution
- Supervisor pattern with worker routing
- Tool execution simulation
- Real-time step tracking
- Token usage and cost estimation

**Jira Client:**
- Issue creation with attachments
- HMAC signature verification for webhooks
- Retry logic with exponential backoff
- Status synchronization

**Semantic Search:**
- pgvector-based similarity search (PostgreSQL)
- Fallback to text search for MySQL
- HNSW indexes for <2ms queries
- Agent discovery and recommendations

### 4. Data Layer

The data layer manages persistence and caching.

**MySQL Database:**
- **users**: OAuth user profiles with roles
- **agent_configs**: Agent configurations and metadata
- **generated_code**: Code artifacts with versioning
- **agent_tools**: Tool definitions and parameters
- **jira_issues**: Approval workflow tracking
- **usage_logs**: Execution metrics and costs
- **daily_metrics**: Aggregated analytics

**S3 Storage:**
- Generated code files
- Versioning enabled
- Lifecycle policies for cost optimization
- Pre-signed URLs for secure access

**Redis Cache:**
- Session data
- Frequently accessed agent configs
- Rate limiting counters
- Temporary execution results

---

## Component Details

### Code Generation Engine

The code generation engine produces production-ready LangGraph code from user configurations.

**Input:** Agent configuration (JSON)
```json
{
  "name": "Financial Analysis Agent",
  "agentType": "supervisor",
  "model": "gpt-4o",
  "workers": [
    {"name": "researcher", "description": "..."},
    {"name": "analyst", "description": "..."}
  ],
  "tools": [...],
  "security": {...}
}
```

**Output:** 5 code files
1. **supervisor.py**: LLM-powered routing with Command pattern
2. **workers.py**: Tool-equipped worker agents
3. **state.py**: State schema with reducers
4. **workflow.py**: LangGraph orchestration
5. **complete.py**: Integrated implementation

**Generation Process:**
1. Validate configuration with Zod schema
2. Generate supervisor code with routing logic
3. Generate worker code with tool bindings
4. Generate state schema with reducers
5. Generate workflow orchestration
6. Combine into complete implementation
7. Save to database and S3

### Security Layer

The security layer implements defense-in-depth with multiple validation stages.

**Layer 1a: PII Detection (Presidio)**
- Detects: SSN, credit cards, account numbers, emails, phone numbers
- Custom recognizers for financial data
- Redaction or rejection based on policy
- 85-95% detection accuracy

**Layer 1b: Guardrails (NeMo)**
- Jailbreak detection
- Content safety validation
- Prompt injection prevention
- 90%+ attack prevention rate

**Layer 3: Output Validation**
- Scans LLM outputs for PII leaks
- Prevents sensitive data exposure
- Audit logging for compliance

**Performance:**
- Total latency: <2 seconds
- Parallel execution of layers 1a and 1b
- Caching of validation results

### Agent Execution Engine

The execution engine simulates agent workflows for testing.

**Execution Flow:**
1. Load agent configuration from database
2. Validate input with security layer
3. Initialize supervisor agent
4. Route to appropriate worker
5. Execute worker with tools
6. Update state with results
7. Repeat until completion
8. Validate output
9. Log usage metrics
10. Return results with steps

**Features:**
- Real-time step visualization
- Token usage tracking
- Cost estimation
- Error handling with retries
- LangSmith trace integration

### Approval Workflow

The approval workflow integrates with Jira for governance.

**Workflow States:**
- **draft**: Initial creation
- **pending**: Submitted for approval
- **approved**: Ready for deployment
- **rejected**: Requires changes
- **production**: Deployed and active

**Jira Integration:**
1. User submits agent for approval
2. System creates Jira issue with details
3. Approver reviews in Jira
4. Jira sends webhook on status change
5. System verifies HMAC signature
6. System updates agent status
7. User receives notification

**Security:**
- HMAC-SHA256 signature verification
- Webhook secret rotation
- IP allowlist for Jira webhooks
- Audit logging

---

## Data Flow

### Agent Creation Flow

```
User → UI (Wizard) → Validation → API → Security Check → 
Code Generator → Database → Jira → User Notification
```

**Steps:**
1. User fills 5-step wizard form
2. Client validates with Zod schemas
3. API receives validated data
4. Security layer checks for PII/jailbreaks
5. Code generator creates 5 code files
6. Database stores configuration and code
7. Jira issue created for approval
8. User receives confirmation

**Duration:** ~2-5 seconds

### Test Run Flow

```
User → UI (Test Dialog) → API → Executor → LLM → 
Security → Results → UI (Step Visualization)
```

**Steps:**
1. User enters test input
2. API loads agent configuration
3. Executor validates input
4. Supervisor routes to worker
5. Worker executes with LLM
6. Output validated for PII
7. Usage metrics logged
8. Results displayed with steps

**Duration:** ~5-10 seconds (depending on agent complexity)

### Approval Flow

```
Jira Webhook → HMAC Verification → Database Update → 
User Notification
```

**Steps:**
1. Approver changes Jira issue status
2. Jira sends webhook to platform
3. Platform verifies HMAC signature
4. Database updates agent status
5. User receives notification

**Duration:** <1 second

---

## Security Architecture

### Authentication & Authorization

**OAuth 2.0 Flow:**
1. User clicks "Login"
2. Redirect to Manus OAuth portal
3. User authenticates
4. OAuth callback with code
5. Exchange code for tokens
6. Create session cookie
7. Store user in database

**Session Management:**
- HTTP-only cookies
- Secure flag enabled
- SameSite=None for cross-origin
- JWT-based sessions
- 7-day expiration

**Authorization:**
- Role-based access control (admin/user)
- Owner automatically promoted to admin
- Resource ownership validation
- API-level permission checks

### Data Security

**Encryption:**
- TLS 1.3 for all connections
- Database encryption at rest
- S3 server-side encryption
- Secrets in environment variables

**PII Protection:**
- Presidio detection before storage
- Redaction of sensitive fields
- Audit logging for compliance
- GDPR-compliant data handling

**Network Security:**
- VPC with public/private subnets
- Security groups for each tier
- NAT gateways for outbound traffic
- AWS WAF for DDoS protection

---

## Deployment Architecture

### AWS Infrastructure

**Compute:**
- ECS Fargate for serverless containers
- Auto-scaling: 2-10 tasks
- CPU-based scaling (target: 70%)
- Memory-based scaling (target: 80%)

**Database:**
- RDS PostgreSQL 15
- Multi-AZ for high availability
- Automated backups (7-day retention)
- Read replicas for analytics

**Storage:**
- S3 for generated code
- Versioning enabled
- Lifecycle policies (30-day archive)
- CloudFront for CDN (optional)

**Networking:**
- Application Load Balancer
- Multi-AZ deployment
- Health checks every 30s
- SSL/TLS termination

**CI/CD:**
- GitHub Actions for builds
- Docker image push to ECR
- CodeDeploy for blue-green deployment
- Automated rollback on failure

### Blue-Green Deployment

**Process:**
1. Build new Docker image
2. Push to ECR
3. CodeDeploy creates new task set (green)
4. Health checks on green tasks
5. Shift 10% traffic to green
6. Wait 5 minutes
7. Shift 50% traffic to green
8. Wait 5 minutes
9. Shift 100% traffic to green
10. Terminate blue tasks

**Rollback:**
- Automatic on CloudWatch alarm
- Manual via CodeDeploy console
- <5 minute rollback time

---

## Scalability & Performance

### Horizontal Scaling

**ECS Auto-Scaling:**
- Min tasks: 2 (high availability)
- Max tasks: 10 (cost control)
- Scale-out threshold: 70% CPU or 80% memory
- Scale-in threshold: 30% CPU and 40% memory
- Cooldown: 300 seconds

**Database Scaling:**
- Read replicas for analytics queries
- Connection pooling (min: 20, max: 100)
- Query optimization with indexes
- Partitioning for large tables

### Performance Targets

**API Latency:**
- Agent CRUD: <500ms (p95)
- Code generation: <2s (p95)
- Test execution: <10s (p95)
- Analytics queries: <1s (p95)

**Throughput:**
- 100+ concurrent agent executions
- 1000+ API requests/second
- 10,000+ daily agent creations

**Database:**
- Semantic search: <2ms (with HNSW indexes)
- Agent lookup: <10ms
- Analytics aggregation: <500ms

---

## Monitoring & Observability

### CloudWatch Metrics

**Application Metrics:**
- Request count
- Error rate
- Latency (p50, p95, p99)
- Active connections

**Infrastructure Metrics:**
- CPU utilization
- Memory utilization
- Network throughput
- Disk I/O

**Business Metrics:**
- Agents created
- Test runs executed
- Approval rate
- User growth

### CloudWatch Alarms

**Critical Alarms:**
- CPU > 80% for 5 minutes
- Memory > 90% for 5 minutes
- Error rate > 5% for 2 minutes
- Latency p95 > 10s for 5 minutes

**Warning Alarms:**
- CPU > 70% for 10 minutes
- Memory > 80% for 10 minutes
- Error rate > 2% for 5 minutes

**Actions:**
- SNS notification to ops team
- Auto-scaling trigger
- Automatic rollback (for deployments)

### LangSmith Tracing

**Tracked Metrics:**
- LLM latency per step
- Token usage per agent
- Cost per execution
- Error rates by agent type
- User feedback scores

**Dashboards:**
- Real-time execution traces
- Cost breakdown by model
- Performance trends
- Error analysis

---

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Automated daily backups
- 7-day retention
- Point-in-time recovery
- Cross-region replication (optional)

**Code Backups:**
- S3 versioning enabled
- Cross-region replication
- Glacier archival after 30 days

**Configuration Backups:**
- Infrastructure as Code (Terraform)
- Version controlled in Git
- Automated state backups

### Recovery Procedures

**RTO (Recovery Time Objective):** 1 hour  
**RPO (Recovery Point Objective):** 5 minutes

**Failure Scenarios:**

**1. Single Task Failure**
- Detection: Health check failure
- Action: ECS automatically replaces task
- Impact: None (load balanced)
- Recovery: <2 minutes

**2. Availability Zone Failure**
- Detection: Multi-AZ health checks
- Action: Traffic routed to healthy AZ
- Impact: Temporary latency increase
- Recovery: <5 minutes

**3. Database Failure**
- Detection: RDS monitoring
- Action: Automatic failover to standby
- Impact: 30-60 seconds downtime
- Recovery: <2 minutes

**4. Region Failure**
- Detection: Route 53 health checks
- Action: Manual failover to backup region
- Impact: 15-30 minutes downtime
- Recovery: <1 hour

### Runbooks

Detailed runbooks available in `/docs/runbooks/`:
- Database failover procedure
- Application rollback procedure
- Security incident response
- Scaling emergency response

---

## Appendix

### Glossary

- **Agent**: LangGraph-based AI workflow
- **Supervisor**: Routing agent that delegates to workers
- **Worker**: Specialized agent with specific tools
- **Tool**: External API or function callable by agents
- **Checkpoint**: Saved state for workflow resumption
- **PII**: Personally Identifiable Information
- **HMAC**: Hash-based Message Authentication Code

### References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Presidio Documentation](https://microsoft.github.io/presidio/)
- [NeMo Guardrails Documentation](https://docs.nvidia.com/nemo/guardrails/)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)

### Change Log

- **v1.0 (January 2025)**: Initial production release
  - All 6 phases complete
  - Enhancement features added
  - Production deployment ready

---

**Document Owner:** Platform Engineering Team  
**Review Cycle:** Quarterly  
**Next Review:** April 2025
