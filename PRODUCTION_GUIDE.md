# Enterprise LangGraph Agent Scaffolding Platform - Production Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Requirements](#system-requirements)
3. [Deployment Procedures](#deployment-procedures)
4. [Security Protocols](#security-protocols)
5. [Operational Runbooks](#operational-runbooks)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)
9. [Disaster Recovery](#disaster-recovery)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  (Next.js 15 + React 19 + Tailwind CSS 4 + tRPC + Zustand)     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Agent      │  │   Approval   │  │   Analytics  │          │
│  │   Management │  │   Workflow   │  │   Engine     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Presidio   │  │     NeMo     │  │    HMAC      │          │
│  │ PII Detection│  │  Guardrails  │  │ Verification │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestration Layer                           │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         LangGraph Supervisor + Workers               │       │
│  │  (Command Pattern, PostgreSQL Checkpointing)         │       │
│  └──────────────────────────────────────────────────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Persistence Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │   pgvector   │  │  Connection  │          │
│  │   Multi-AZ   │  │    Indexes   │  │     Pool     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  AWS ECS     │  │  Application │  │  CloudWatch  │          │
│  │  Fargate     │  │Load Balancer │  │  Monitoring  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → UI (Next.js)
2. **Form Validation** → Zod schemas
3. **Security Check** → Presidio PII + NeMo Guardrails
4. **Agent Creation** → Database + Code Generation
5. **Approval Workflow** → Jira Integration
6. **Production Deployment** → AWS ECS via CodeDeploy
7. **Execution** → LangGraph Supervisor + Workers
8. **Checkpointing** → PostgreSQL
9. **Observability** → LangSmith + CloudWatch

---

## System Requirements

### Production Environment

**Minimum Requirements:**
- **Compute:** AWS ECS Fargate (2 vCPU, 4GB RAM per task)
- **Database:** PostgreSQL 14+ with pgvector extension
- **Storage:** 100GB SSD for database
- **Network:** VPC with public/private subnets, NAT gateway
- **Load Balancer:** Application Load Balancer (ALB)

**Recommended for 100+ Concurrent Agents:**
- **Compute:** 10+ Fargate tasks (auto-scaling)
- **Database:** db.r6g.xlarge (4 vCPU, 32GB RAM) Multi-AZ
- **Connection Pool:** min_size=20, max_size=100
- **Storage:** 500GB SSD with automated backups

### Software Dependencies

```json
{
  "runtime": "Node.js 22.x",
  "database": "PostgreSQL 14+ with pgvector",
  "python": "Python 3.11+ (for reference agents)",
  "terraform": "1.5+",
  "aws-cli": "2.x"
}
```

---

## Deployment Procedures

### Initial Deployment

**Step 1: Infrastructure Provisioning**

```bash
cd terraform
terraform init
terraform plan -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

**Step 2: Database Setup**

```bash
# Connect to RDS PostgreSQL
psql -h <rds-endpoint> -U admin -d langgraph_platform

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Run migrations
pnpm db:push
```

**Step 3: Application Deployment**

```bash
# Build Docker image
docker build -t langgraph-platform:latest .

# Tag for ECR
docker tag langgraph-platform:latest <ecr-repo>:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-repo>
docker push <ecr-repo>:latest

# Deploy via CodeDeploy
aws deploy create-deployment \
  --application-name langgraph-platform \
  --deployment-group-name production \
  --revision revisionType=S3,s3Location={bucket=deployments,key=app.zip,bundleType=zip}
```

### Blue-Green Deployment

CodeDeploy automatically handles blue-green deployments with the following pattern:

1. **Deploy to Green Environment** (10% traffic)
2. **Wait 5 minutes** (monitor CloudWatch alarms)
3. **Shift to 50% traffic**
4. **Wait 5 minutes**
5. **Shift to 100% traffic**
6. **Terminate Blue Environment** (after 1 hour)

**Automatic Rollback Triggers:**
- Error rate > 5%
- Response time > 5 seconds (p99)
- CPU utilization > 90%
- Memory utilization > 90%

### Rollback Procedure

```bash
# Manual rollback to previous deployment
aws deploy stop-deployment --deployment-id <deployment-id>

# Or rollback via Terraform
terraform apply -var="image_tag=<previous-version>"
```

---

## Security Protocols

### 3-Layer Security Architecture

**Layer 1a: Presidio PII Detection**
- Detects SSN, credit cards, emails, phone numbers
- Custom recognizers for financial data
- 85-95% detection accuracy
- Latency: <500ms

**Layer 1b: NeMo Guardrails**
- Jailbreak prevention (90%+ success rate)
- Content safety validation
- Topic restriction enforcement
- Latency: <1s

**Layer 3: Output Verification**
- PII leak detection in responses
- Compliance validation
- Audit logging

### HMAC Webhook Verification

All Jira webhooks must include valid HMAC signatures:

```typescript
import crypto from "crypto";

function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### SQL Injection Prevention

- All database queries use parameterized statements via Drizzle ORM
- No raw SQL execution from user input
- Input validation via Zod schemas

### XSS Prevention

- All user input sanitized before rendering
- Content Security Policy (CSP) headers enforced
- React's built-in XSS protection

---

## Operational Runbooks

### Runbook 1: High Error Rate Alert

**Trigger:** Error rate > 5% for 5 minutes

**Steps:**
1. Check CloudWatch Logs for error patterns
2. Verify database connectivity
3. Check LangSmith traces for failed agent executions
4. Review recent deployments (rollback if needed)
5. Scale up ECS tasks if resource-constrained

**Resolution Time:** 15 minutes

### Runbook 2: Database Connection Pool Exhaustion

**Trigger:** "Too many connections" errors

**Steps:**
1. Check current connection count: `SELECT count(*) FROM pg_stat_activity;`
2. Identify long-running queries: `SELECT * FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';`
3. Kill problematic connections: `SELECT pg_terminate_backend(pid);`
4. Increase connection pool max_size if needed
5. Review application code for connection leaks

**Resolution Time:** 10 minutes

### Runbook 3: Slow Semantic Search Queries

**Trigger:** Search queries > 2ms (p95)

**Steps:**
1. Verify HNSW indexes exist: `\d+ agent_configs`
2. Rebuild indexes if needed: `REINDEX INDEX agent_description_vector_idx;`
3. Analyze query plan: `EXPLAIN ANALYZE SELECT ...`
4. Check database CPU/memory utilization
5. Consider upgrading database instance size

**Resolution Time:** 30 minutes

### Runbook 4: Failed Blue-Green Deployment

**Trigger:** Automatic rollback triggered

**Steps:**
1. Check CodeDeploy deployment logs
2. Review CloudWatch alarms that triggered rollback
3. Analyze application logs for errors
4. Fix issues in code
5. Re-deploy with fixes

**Resolution Time:** 1-2 hours

### Runbook 5: Jira Webhook Failures

**Trigger:** Webhook retry count > 3

**Steps:**
1. Verify HMAC secret is correct
2. Check webhook endpoint is accessible
3. Review webhook payload format
4. Check database for webhook processing errors
5. Manually process failed webhooks if needed

**Resolution Time:** 20 minutes

---

## Monitoring & Alerting

### CloudWatch Dashboards

**Dashboard 1: Application Health**
- Request count (per minute)
- Error rate (%)
- Response time (p50, p95, p99)
- Active connections

**Dashboard 2: Infrastructure**
- ECS task count
- CPU utilization (%)
- Memory utilization (%)
- Network throughput

**Dashboard 3: Database**
- Connection count
- Query latency
- Replication lag (Multi-AZ)
- Storage utilization

### Critical Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| Error Rate | > 5% for 5 min | Page on-call, rollback deployment |
| Response Time | p99 > 5s for 5 min | Scale up tasks, investigate slow queries |
| CPU Utilization | > 90% for 10 min | Auto-scale up |
| Memory Utilization | > 90% for 10 min | Auto-scale up |
| Database Connections | > 90 | Alert, investigate connection leaks |
| Disk Space | > 85% | Alert, expand storage |

### LangSmith Monitoring

- **Trace all agent executions**
- **Track token usage and costs**
- **Monitor success/failure rates**
- **Identify slow steps in workflows**

Access LangSmith dashboard: https://smith.langchain.com

---

## Troubleshooting

### Common Issues

**Issue 1: Agent creation fails with validation errors**

**Symptoms:** Form submission returns Zod validation errors

**Diagnosis:**
- Check browser console for detailed error messages
- Verify all required fields are filled
- Check field types match schema

**Solution:**
- Fix validation errors in UI
- Update Zod schema if requirements changed

---

**Issue 2: Semantic search returns no results**

**Symptoms:** Search query returns empty array

**Diagnosis:**
- Check if agents exist in database
- Verify pgvector extension is installed
- Check if embeddings are generated

**Solution:**
```sql
-- Verify pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check for agents with embeddings
SELECT id, name, description_embedding FROM agent_configs WHERE description_embedding IS NOT NULL;
```

---

**Issue 3: Approval workflow stuck in pending**

**Symptoms:** Agent status remains "pending" after Jira approval

**Diagnosis:**
- Check Jira webhook delivery logs
- Verify HMAC signature is valid
- Check webhook handler logs in CloudWatch

**Solution:**
- Manually trigger webhook handler with Jira issue key
- Verify webhook secret matches Jira configuration

---

## Performance Optimization

### Database Optimization

**Connection Pooling:**
```typescript
const pool = new Pool({
  min: 20,
  max: 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Index Optimization:**
```sql
-- HNSW index for vector search
CREATE INDEX agent_description_vector_idx 
ON agent_configs 
USING hnsw (description_embedding vector_cosine_ops);

-- B-tree indexes for frequent queries
CREATE INDEX agent_user_id_idx ON agent_configs(user_id);
CREATE INDEX agent_status_idx ON agent_configs(status);
```

### Auto-Scaling Configuration

**Target Tracking Policies:**
- CPU: 70% target
- Memory: 80% target
- Request Count: 1000 requests/target/minute

**Scale-Out:**
- Cooldown: 60 seconds
- Step: +2 tasks

**Scale-In:**
- Cooldown: 300 seconds
- Step: -1 task

### Caching Strategy

**Application-Level Caching:**
- Agent configurations (5 minute TTL)
- User profiles (10 minute TTL)
- Analytics aggregates (1 hour TTL)

**Database Query Caching:**
- Frequently accessed agents
- Popular search queries

---

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Automated daily backups (retained 30 days)
- Point-in-time recovery enabled
- Cross-region replication (optional)

**Application Backups:**
- Docker images stored in ECR
- Terraform state in S3 with versioning
- Configuration in Git

### Recovery Procedures

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 1 hour

**Scenario 1: Database Failure**

1. Promote read replica to primary (Multi-AZ automatic failover)
2. Update application connection string if needed
3. Verify data integrity
4. Resume operations

**Estimated Recovery Time:** 15 minutes (automatic)

**Scenario 2: Complete Region Failure**

1. Provision infrastructure in backup region using Terraform
2. Restore database from latest backup
3. Deploy application from ECR
4. Update DNS to point to new region
5. Verify all systems operational

**Estimated Recovery Time:** 4 hours

**Scenario 3: Data Corruption**

1. Identify corruption time from logs
2. Restore database to point-in-time before corruption
3. Replay transactions from audit logs if needed
4. Verify data integrity
5. Resume operations

**Estimated Recovery Time:** 2 hours

---

## Production Launch Checklist

### Pre-Launch

- [ ] All Terraform infrastructure provisioned
- [ ] Database Multi-AZ with automated backups
- [ ] pgvector extension installed
- [ ] Connection pool configured (min:20, max:100)
- [ ] Security layers tested (Presidio, NeMo Guardrails)
- [ ] HMAC webhook verification active
- [ ] LangGraph supervisor pattern implemented
- [ ] PostgreSQL checkpointing operational
- [ ] 100+ concurrent agent capacity validated
- [ ] Multi-step wizard functional
- [ ] Form validation working
- [ ] Code generation tested
- [ ] Jira webhook handlers deployed
- [ ] Approval workflow end-to-end tested
- [ ] Semantic search <2ms queries
- [ ] Usage analytics aggregating
- [ ] ECS Fargate with blue-green deployment
- [ ] Auto-scaling policies configured
- [ ] CloudWatch monitoring active
- [ ] LangSmith tracing enabled
- [ ] All test suites passing (80%+ coverage)
- [ ] Load testing at 100+ concurrency successful
- [ ] Documentation complete
- [ ] Runbooks created
- [ ] On-call rotation established

### Post-Launch

- [ ] Monitor CloudWatch dashboards (first 24 hours)
- [ ] Review LangSmith traces for errors
- [ ] Validate auto-scaling behavior
- [ ] Check database performance metrics
- [ ] Verify backup jobs running
- [ ] Test disaster recovery procedures
- [ ] Collect user feedback
- [ ] Optimize based on real-world usage patterns

---

## Support & Escalation

### Support Tiers

**Tier 1:** Application issues, user questions
- Response Time: 1 hour
- Resolution Time: 4 hours

**Tier 2:** Infrastructure issues, performance degradation
- Response Time: 30 minutes
- Resolution Time: 2 hours

**Tier 3:** Critical outages, data loss
- Response Time: 15 minutes
- Resolution Time: 1 hour

### Escalation Path

1. **On-Call Engineer** → Investigate and resolve
2. **Team Lead** → Coordinate resources if needed
3. **Engineering Manager** → Executive decision making
4. **CTO** → Critical business impact

---

## Appendix

### Reference Agents

The platform includes 5 production-ready reference agents:

1. **Financial Analysis Agent** - Market data + sentiment scoring
2. **Compliance Monitoring Agent** - Fraud detection + watchlist screening
3. **Credit Underwriting Agent** - Policy-based decision trees
4. **Fraud Detection Agent** - Real-time alert processing
5. **Portfolio Management Agent** - Technical + fundamental analysis

See `/reference-agents/` directory for implementation details.

### API Documentation

Full API documentation available at: `/docs/API.md`

### Cost Estimates

**Monthly AWS Costs (100 concurrent agents):**
- ECS Fargate: $150
- RDS PostgreSQL: $180
- ALB: $20
- Data Transfer: $30
- CloudWatch: $20
- **Total: ~$400/month**

**LLM Costs (GPT-4o-mini):**
- ~$50-200/month depending on usage

---

**Document Version:** 1.0
**Last Updated:** 2024
**Maintained By:** Platform Engineering Team
