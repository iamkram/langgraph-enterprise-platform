# Phase 5: AWS Deployment & Observability

**Implementation Period:** Weeks 9-10  
**Status:** Complete ✅

## Overview

Phase 5 delivers production-ready AWS infrastructure with Terraform IaC, blue-green deployments via CodeDeploy, LangSmith observability integration, and comprehensive auto-scaling policies.

## Infrastructure Architecture

### High-Level Architecture

```
Internet
    ↓
Application Load Balancer (Multi-AZ)
    ↓
ECS Fargate Service (Auto-scaling 2-10 tasks)
    ↓
RDS PostgreSQL Multi-AZ (with pgvector)
```

### Components

**Network Layer:**
- VPC with 3 availability zones
- Public subnets (3x) for ALB
- Private subnets (3x) for ECS tasks and RDS
- NAT Gateways (3x) for outbound internet access
- VPC Endpoints for S3 (cost optimization)

**Compute Layer:**
- ECS Fargate cluster with Container Insights
- Auto-scaling: 2-10 tasks based on CPU, memory, and request count
- Blue-green deployment support via CodeDeploy
- CloudWatch Logs with 7-day retention

**Database Layer:**
- RDS PostgreSQL 15.4 Multi-AZ
- pgvector extension enabled
- Automated backups (7-day retention)
- Performance Insights enabled
- Enhanced Monitoring (60s interval)

**Load Balancing:**
- Application Load Balancer (internet-facing)
- HTTPS with ACM certificate (optional)
- HTTP → HTTPS redirect
- Health checks every 30s

**Monitoring & Alerting:**
- CloudWatch Dashboard with ECS and ALB metrics
- 5 CloudWatch Alarms (CPU, memory, 5XX errors, latency, unhealthy targets)
- SNS topics for alarm notifications
- Deployment state change notifications

## Terraform Modules

### Module Structure

```
terraform/
├── main.tf                    # Root configuration
├── variables.tf               # Input variables
├── codedeploy.tf             # Blue-green deployment config
├── modules/
│   ├── vpc/                  # VPC with multi-AZ subnets
│   ├── rds/                  # PostgreSQL Multi-AZ
│   ├── ecs/                  # Fargate cluster & service
│   ├── alb/                  # Application Load Balancer
│   ├── iam/                  # IAM roles and policies
│   └── monitoring/           # CloudWatch dashboards & alarms
└── environments/
    ├── staging/
    └── production/
```

### Key Features

**VPC Module:**
- Multi-AZ deployment across 3 availability zones
- Public and private subnet separation
- NAT Gateways for private subnet internet access
- S3 VPC Endpoint for cost savings

**RDS Module:**
- PostgreSQL 15.4 with pgvector support
- Multi-AZ for high availability
- Automated backups with 7-day retention
- Storage auto-scaling (up to 2x allocated storage)
- Enhanced monitoring and Performance Insights

**ECS Module:**
- Fargate launch type (serverless)
- Container Insights enabled
- 3-tier auto-scaling (CPU, memory, request count)
- Blue-green deployment controller
- Execute Command enabled for debugging

**ALB Module:**
- Internet-facing Application Load Balancer
- HTTPS support with ACM certificate
- HTTP → HTTPS redirect
- Blue and green target groups for deployments
- Health checks with 30s interval

**IAM Module:**
- ECS task execution role (pull images, write logs)
- ECS task role (S3 access, Secrets Manager)
- RDS enhanced monitoring role
- CodeDeploy service role

**Monitoring Module:**
- CloudWatch Dashboard with key metrics
- CPU utilization alarm (threshold: 80%)
- Memory utilization alarm (threshold: 85%)
- 5XX error alarm (threshold: 10 errors/5min)
- Response time alarm (threshold: 2s)
- Unhealthy target alarm

## Blue-Green Deployment

### Deployment Strategy

**Canary Patterns:**
1. **Canary 10% / 5 minutes** (default)
   - 10% traffic → green environment
   - Wait 5 minutes
   - If healthy, shift 100% traffic

2. **Canary 10% / 15 minutes** (custom)
   - 10% traffic → green environment
   - Wait 15 minutes
   - If healthy, shift 100% traffic

3. **Linear 10% / 5 minutes** (custom)
   - 10% traffic every 5 minutes
   - 10 steps to reach 100%

### Automatic Rollback

Deployment automatically rolls back if:
- 5XX error count > 5 in 1 minute
- Average response time > 3s
- CPU utilization > 80% for 2 evaluation periods
- Memory utilization > 85% for 2 evaluation periods
- Any target becomes unhealthy

### Deployment Workflow

1. Push new Docker image to ECR
2. Update ECS task definition with new image
3. CodeDeploy creates green environment
4. Traffic shifts to green (canary pattern)
5. Health checks validate green environment
6. If healthy: terminate blue environment
7. If unhealthy: automatic rollback to blue

## Auto-Scaling

### Scaling Policies

**CPU-Based Scaling:**
- Target: 70% CPU utilization
- Scale-out cooldown: 60 seconds
- Scale-in cooldown: 300 seconds

**Memory-Based Scaling:**
- Target: 80% memory utilization
- Scale-out cooldown: 60 seconds
- Scale-in cooldown: 300 seconds

**Request Count Scaling:**
- Target: 1000 requests per target
- Scale-out cooldown: 60 seconds
- Scale-in cooldown: 300 seconds

### Scaling Limits

- Minimum tasks: 2 (high availability)
- Maximum tasks: 10 (cost control)
- Desired count: 2 (initial state)

### Scaling Behavior

**Scale-Out Triggers:**
- CPU > 70% for 1 minute
- Memory > 80% for 1 minute
- Request count > 1000/target for 1 minute

**Scale-In Triggers:**
- CPU < 70% for 5 minutes
- Memory < 80% for 5 minutes
- Request count < 1000/target for 5 minutes

## LangSmith Integration

### Tracing Configuration

**Environment Variables:**
```bash
LANGSMITH_API_KEY=<your-api-key>
LANGSMITH_PROJECT=langgraph-platform
LANGSMITH_TRACING=true
LANGCHAIN_TRACING_V2=true
```

### Features

**Automatic Tracing:**
- All agent executions automatically traced
- Supervisor and worker agent traces
- Input/output capture
- Error tracking

**Cost Tracking:**
- Per-model pricing (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
- Token usage tracking
- Cost calculation per execution
- Aggregated cost reporting

**Performance Monitoring:**
- Execution time tracking
- Latency metrics
- Success/failure rates
- Run statistics export

### Usage

```typescript
import { traceAgentExecution } from './langsmith/tracing';

const result = await traceAgentExecution(
  'financial-analysis-agent',
  { query: 'Analyze AAPL stock' },
  async () => {
    // Agent execution logic
    return await executeAgent();
  },
  {
    projectName: 'langgraph-platform',
    tags: ['financial', 'production'],
    metadata: { agentConfigId: 123 },
    userId: 'user-456',
  }
);
```

## Deployment Guide

### Prerequisites

1. AWS Account with appropriate permissions
2. Terraform >= 1.0 installed
3. Docker image pushed to ECR
4. ACM certificate for HTTPS (optional)
5. LangSmith API key

### Step 1: Configure Variables

Create `terraform.tfvars`:

```hcl
# Environment
environment = "production"
aws_region  = "us-east-1"

# Database
database_username = "langgraph_admin"
database_password = "<secure-password>"

# Container
container_image = "<aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/langgraph-platform:latest"

# LangSmith
langsmith_api_key = "<your-langsmith-api-key>"

# Jira
jira_base_url       = "https://your-domain.atlassian.net"
jira_email          = "your-email@example.com"
jira_api_token      = "<your-jira-api-token>"
jira_webhook_secret = "<your-webhook-secret>"

# Monitoring
sns_alarm_email = "ops-team@example.com"

# Optional: HTTPS
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."
```

### Step 2: Initialize Terraform

```bash
cd terraform
terraform init -backend-config="bucket=your-terraform-state-bucket"
```

### Step 3: Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully. Expected resources: ~50-60 resources.

### Step 4: Apply Infrastructure

```bash
terraform apply tfplan
```

Deployment time: ~15-20 minutes (RDS Multi-AZ takes longest).

### Step 5: Verify Deployment

```bash
# Get ALB DNS name
terraform output alb_dns_name

# Test health endpoint
curl http://<alb-dns-name>/health

# Check ECS service
aws ecs describe-services \
  --cluster $(terraform output ecs_cluster_name) \
  --services $(terraform output ecs_service_name)
```

### Step 6: Configure DNS

Point your domain to the ALB DNS name:

```
CNAME: app.yourdomain.com → <alb-dns-name>
```

### Step 7: Verify HTTPS

```bash
curl https://app.yourdomain.com/health
```

## Monitoring & Operations

### CloudWatch Dashboard

Access dashboard:
```bash
terraform output cloudwatch_dashboard_url
```

**Key Metrics:**
- ECS CPU Utilization
- ECS Memory Utilization
- ALB Request Count
- Target Response Time

### CloudWatch Alarms

**Configured Alarms:**
1. `ecs-cpu-high` - CPU > 80% for 10 minutes
2. `ecs-memory-high` - Memory > 85% for 10 minutes
3. `alb-5xx-errors` - 5XX count > 10 in 5 minutes
4. `alb-response-time` - Avg latency > 2s for 5 minutes
5. `unhealthy-targets` - Any target unhealthy

**Alarm Actions:**
- Send email to `sns_alarm_email`
- Trigger automatic rollback (deployment alarms)

### Logs

**ECS Task Logs:**
```bash
aws logs tail /ecs/langgraph-production --follow
```

**RDS Logs:**
```bash
aws rds describe-db-log-files \
  --db-instance-identifier langgraph-production-<id>
```

### Debugging

**Execute Command in Running Task:**
```bash
aws ecs execute-command \
  --cluster langgraph-production-cluster \
  --task <task-id> \
  --container app \
  --interactive \
  --command "/bin/sh"
```

## Cost Optimization

### Estimated Monthly Costs (us-east-1)

**Compute:**
- ECS Fargate (2 tasks, 1vCPU, 2GB): ~$50/month
- NAT Gateways (3x): ~$100/month

**Database:**
- RDS db.t3.medium Multi-AZ: ~$120/month
- Storage (100GB gp3): ~$25/month

**Load Balancing:**
- ALB: ~$20/month
- Data transfer: ~$10/month

**Monitoring:**
- CloudWatch Logs (7-day retention): ~$5/month
- CloudWatch Alarms: ~$1/month

**Total: ~$330/month** (baseline, 2 tasks)

### Cost Reduction Strategies

1. **Use Fargate Spot** (up to 70% savings)
2. **Reduce NAT Gateways** (1 per AZ → 1 total)
3. **Use RDS Reserved Instances** (up to 60% savings)
4. **Optimize log retention** (7 days → 3 days)
5. **Use S3 VPC Endpoint** (already implemented)

## Security Best Practices

### Network Security

- Private subnets for ECS tasks and RDS
- Security groups with least-privilege rules
- No public IPs for ECS tasks
- TLS 1.2+ for ALB HTTPS

### Data Security

- RDS encryption at rest (enabled)
- RDS automated backups (7-day retention)
- Secrets stored in environment variables (consider AWS Secrets Manager)
- IAM roles with least-privilege policies

### Application Security

- Container image scanning (implement in CI/CD)
- Regular dependency updates
- LangSmith tracing for audit trail
- Jira webhook HMAC verification

## Disaster Recovery

### RDS Backups

- Automated daily backups (7-day retention)
- Backup window: 03:00-04:00 UTC
- Multi-AZ for automatic failover

### RDS Failover

- Automatic failover to standby (1-2 minutes)
- No data loss (synchronous replication)
- Connection string remains the same

### ECS Service Recovery

- ECS automatically replaces failed tasks
- Health checks detect unhealthy tasks
- Auto-scaling maintains desired count

### Rollback Procedures

**Application Rollback:**
1. CodeDeploy automatic rollback (if alarms trigger)
2. Manual rollback via AWS Console
3. Deploy previous task definition

**Infrastructure Rollback:**
```bash
terraform plan -destroy -target=<resource>
terraform apply
```

## Performance Benchmarks

### Target Metrics

- Response time: < 500ms (p95)
- Availability: > 99.9%
- Error rate: < 0.1%
- Deployment time: < 10 minutes
- Failover time: < 2 minutes

### Load Testing

**Recommended Tools:**
- Apache JMeter
- Gatling
- k6

**Test Scenarios:**
1. Baseline: 100 concurrent users
2. Peak: 1000 concurrent users
3. Stress: 2000+ concurrent users

## Troubleshooting

### Common Issues

**Issue: Tasks failing health checks**
- Check CloudWatch Logs for application errors
- Verify `/health` endpoint returns 200
- Increase `health_check_grace_period_seconds`

**Issue: High CPU utilization**
- Check for inefficient queries
- Optimize LangGraph agent logic
- Increase task CPU allocation

**Issue: Deployment stuck**
- Check CodeDeploy console for errors
- Verify target group health checks
- Check CloudWatch Alarms

**Issue: Database connection errors**
- Verify security group rules
- Check RDS instance status
- Verify connection string

## Next Steps

1. **Implement CI/CD Pipeline**
   - GitHub Actions or AWS CodePipeline
   - Automated testing and deployment
   - Container image scanning

2. **Add Observability**
   - Integrate with Datadog or New Relic
   - Custom application metrics
   - Distributed tracing

3. **Enhance Security**
   - Move secrets to AWS Secrets Manager
   - Implement WAF rules
   - Enable GuardDuty

4. **Optimize Costs**
   - Implement Fargate Spot
   - Use RDS Reserved Instances
   - Optimize resource allocation

5. **Disaster Recovery**
   - Cross-region replication
   - Automated disaster recovery testing
   - Runbook automation

---

**Phase 5 Status:** ✅ Production-ready AWS infrastructure with IaC, blue-green deployments, observability, and auto-scaling.
