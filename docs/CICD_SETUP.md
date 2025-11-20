# CI/CD Pipeline Setup Guide

This document describes the automated CI/CD pipeline for the LangGraph Enterprise Platform using GitHub Actions and AWS CodeDeploy.

## Overview

The CI/CD pipeline automates:
- **Testing:** Unit, integration, and E2E tests
- **Building:** Docker image creation and push to ECR
- **Security Scanning:** Container vulnerability scanning with Trivy
- **Deployment:** Blue-green deployment to staging and production
- **Rollback:** Automatic rollback on deployment failure
- **Notifications:** Slack notifications for deployment status

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Push/PR                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Run Tests                                │
│  - TypeScript check                                          │
│  - Unit tests                                                │
│  - Integration tests                                         │
│  - Coverage report                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Build & Push Docker Image                     │
│  - Multi-stage build                                         │
│  - Push to Amazon ECR                                        │
│  - Tag with SHA + timestamp                                  │
│  - Security scan with Trivy                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
┌───────────────────────┐  ┌──────────────────────┐
│   Deploy to Staging   │  │ Deploy to Production │
│   (staging branch)    │  │    (main branch)     │
│                       │  │                      │
│  - Update ECS task    │  │  - CodeDeploy        │
│  - Deploy to ECS      │  │  - Blue-green        │
│  - Smoke tests        │  │  - Canary traffic    │
│  - Slack notification │  │  - Smoke tests       │
└───────────────────────┘  │  - Create release    │
                           │  - Slack notification│
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │  Rollback on Failure │
                           │  - Stop deployment   │
                           │  - Auto rollback     │
                           │  - Notify team       │
                           └──────────────────────┘
```

## Prerequisites

### 1. AWS Resources

Ensure the following AWS resources are created (via Terraform):

- **ECR Repository:** `langgraph-platform`
- **ECS Cluster:** `langgraph-platform-cluster`
- **ECS Service:** `langgraph-platform-service`
- **CodeDeploy Application:** `langgraph-platform`
- **CodeDeploy Deployment Group:** `langgraph-platform-deployment-group`
- **IAM Roles:** ECS task execution role, CodeDeploy service role

### 2. GitHub Secrets

Configure the following secrets in your GitHub repository:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>

# Database
TEST_DATABASE_URL=<test-database-url>
DATABASE_URL=<production-database-url>

# API Keys
OPENAI_API_KEY=<your-openai-api-key>

# Notifications
SLACK_WEBHOOK=<your-slack-webhook-url>
```

To add secrets:
```bash
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set DATABASE_URL
gh secret set OPENAI_API_KEY
gh secret set SLACK_WEBHOOK
```

### 3. GitHub Environments

Create two environments in GitHub:
- **staging:** For staging deployments
- **production:** For production deployments (with required reviewers)

## Workflow Triggers

### Automatic Triggers

- **Push to `main`:** Triggers full pipeline → Production deployment
- **Push to `staging`:** Triggers full pipeline → Staging deployment
- **Pull Request:** Triggers tests only (no deployment)

### Manual Triggers

You can manually trigger deployments via GitHub Actions UI.

## Deployment Process

### Staging Deployment

1. Push to `staging` branch
2. Tests run automatically
3. Docker image built and pushed to ECR
4. Image scanned for vulnerabilities
5. Deployed to staging ECS service
6. Smoke tests verify deployment
7. Slack notification sent

**Staging URL:** https://staging.langgraph-platform.example.com

### Production Deployment

1. Push to `main` branch (or merge PR)
2. Tests run automatically
3. Docker image built and pushed to ECR
4. Image scanned for vulnerabilities
5. **Blue-Green Deployment via CodeDeploy:**
   - Deploy to green environment
   - Shift 10% traffic → wait 5 min
   - Shift 50% traffic → wait 5 min
   - Shift 100% traffic
   - Terminate blue environment
6. Smoke tests verify deployment
7. GitHub release created
8. Slack notification sent

**Production URL:** https://langgraph-platform.example.com

### Automatic Rollback

If deployment fails (smoke tests fail or CloudWatch alarms trigger):
1. CodeDeploy automatically stops deployment
2. Traffic shifted back to blue environment
3. Green environment terminated
4. Team notified via Slack

## Docker Build

### Multi-Stage Build

The Dockerfile uses a 3-stage build for optimization:

1. **Frontend Builder:** Builds React app with Vite
2. **Backend Builder:** Installs production dependencies
3. **Production Image:** Minimal Alpine-based image

**Image Size:** ~200MB (optimized)

### Build Arguments

```dockerfile
ARG NODE_ENV=production
```

### Health Check

Container includes built-in health check:
```bash
curl http://localhost:3000/health
```

## Monitoring

### Build Status

Check build status on GitHub Actions:
```
https://github.com/<your-org>/langgraph-enterprise-platform/actions
```

### Deployment Status

Check deployment status in AWS CodeDeploy console:
```
AWS Console → CodeDeploy → Applications → langgraph-platform
```

### Logs

View logs in CloudWatch:
```
AWS Console → CloudWatch → Log Groups → /ecs/langgraph-platform
```

## Troubleshooting

### Build Failures

**Issue:** Tests failing
```bash
# Run tests locally
pnpm test

# Check specific test
pnpm test phase6.comprehensive.test.ts
```

**Issue:** Docker build failing
```bash
# Build locally
docker build -t langgraph-platform .

# Check build logs
docker build --progress=plain -t langgraph-platform .
```

### Deployment Failures

**Issue:** ECS service not starting
```bash
# Check ECS service events
aws ecs describe-services \
  --cluster langgraph-platform-cluster \
  --services langgraph-platform-service

# Check task logs
aws logs tail /ecs/langgraph-platform --follow
```

**Issue:** Health checks failing
```bash
# SSH into ECS task
aws ecs execute-command \
  --cluster langgraph-platform-cluster \
  --task <task-id> \
  --interactive \
  --command "/bin/sh"

# Check health endpoint
curl http://localhost:3000/health
```

**Issue:** CodeDeploy rollback
```bash
# Check deployment details
aws deploy get-deployment --deployment-id <deployment-id>

# View deployment logs
aws deploy get-deployment-target \
  --deployment-id <deployment-id> \
  --target-id <target-id>
```

### Rollback Manually

If automatic rollback fails:

```bash
# List recent deployments
aws deploy list-deployments \
  --application-name langgraph-platform \
  --deployment-group-name langgraph-platform-deployment-group

# Stop current deployment
aws deploy stop-deployment \
  --deployment-id <deployment-id> \
  --auto-rollback-enabled

# Deploy previous version
aws deploy create-deployment \
  --application-name langgraph-platform \
  --deployment-group-name langgraph-platform-deployment-group \
  --revision revisionType=S3,s3Location={bucket=<bucket>,key=<previous-version>,bundleType=zip}
```

## Performance Optimization

### Build Cache

GitHub Actions uses layer caching to speed up builds:
- **Frontend dependencies:** Cached by pnpm
- **Docker layers:** Cached by GitHub Actions cache
- **Average build time:** 3-5 minutes

### Parallel Jobs

Tests and builds run in parallel where possible:
- **Test job:** Runs independently
- **Build job:** Waits for tests to pass
- **Deploy jobs:** Run after build completes

## Security

### Image Scanning

All images are scanned with Trivy before deployment:
- **Critical vulnerabilities:** Block deployment
- **High vulnerabilities:** Warning (deploy with approval)
- **Medium/Low vulnerabilities:** Informational

### Secrets Management

- **GitHub Secrets:** Encrypted at rest
- **AWS Secrets Manager:** For runtime secrets
- **Environment Variables:** Injected at deployment time

### Access Control

- **Production deployments:** Require approval from designated reviewers
- **AWS credentials:** Scoped to minimum required permissions
- **ECR images:** Private repository with IAM-based access

## Cost Optimization

### Build Minutes

- **Free tier:** 2,000 minutes/month for public repos
- **Paid tier:** $0.008/minute for private repos
- **Average pipeline:** 10-15 minutes
- **Monthly cost:** ~$5-10 for 50 deployments

### ECR Storage

- **Image size:** ~200MB
- **Retention:** Keep last 10 images
- **Monthly cost:** ~$1-2

## Best Practices

### Branch Strategy

```
main (production)
  ↑
  └── staging
       ↑
       └── feature branches
```

1. Create feature branch from `staging`
2. Open PR to `staging`
3. Tests run automatically
4. Merge to `staging` → Deploy to staging
5. Test in staging environment
6. Open PR from `staging` to `main`
7. Merge to `main` → Deploy to production

### Commit Messages

Use conventional commits for automatic changelog generation:
```
feat: add agent templates library
fix: resolve TypeScript errors in wizard
docs: update deployment guide
chore: upgrade dependencies
```

### Testing Before Deploy

Always test locally before pushing:
```bash
# Run all tests
pnpm test

# Build Docker image
docker build -t langgraph-platform .

# Run container locally
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  langgraph-platform

# Test health endpoint
curl http://localhost:3000/health
```

## Monitoring & Alerts

### Slack Notifications

The pipeline sends notifications for:
- ✅ Successful deployments
- ❌ Failed deployments
- ⚠️ Rollbacks
- 📦 New releases

### CloudWatch Alarms

Alarms trigger automatic rollback:
- **Error rate > 5%**
- **Response time > 5s (p99)**
- **CPU > 90%**
- **Memory > 90%**

## Maintenance

### Update Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update <package-name>

# Run tests
pnpm test

# Commit and push
git add package.json pnpm-lock.yaml
git commit -m "chore: update dependencies"
git push
```

### Rotate Secrets

```bash
# Update GitHub secret
gh secret set AWS_ACCESS_KEY_ID

# Update AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id langgraph-platform/database-url \
  --secret-string "new-database-url"

# Restart ECS service to pick up new secrets
aws ecs update-service \
  --cluster langgraph-platform-cluster \
  --service langgraph-platform-service \
  --force-new-deployment
```

## Support

For issues with CI/CD pipeline:
1. Check GitHub Actions logs
2. Review AWS CodeDeploy console
3. Check CloudWatch logs
4. Contact DevOps team via Slack: #devops-support

---

**Last Updated:** 2025-01-20
**Maintained By:** DevOps Team
