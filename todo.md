# Phase 4 TODO (Weeks 7-8: Jira Integration & Agent Registry)

## Jira Integration
- [x] Configure Jira webhook endpoints
- [x] Implement HMAC signature verification for webhooks
- [x] Create issue creation API with attachment support
- [x] Build webhook handler for issue status updates
- [x] Add retry logic for webhook failures
- [ ] Test webhook reliability under retry scenarios

## Agent Registry
- [x] Extend database schema for agent registry
- [x] Add agent versioning support
- [x] Implement agent status tracking (draft, pending, approved, rejected, production)
- [x] Create pgvector embeddings for agent descriptions (simulated for MySQL)
- [x] Build semantic search API with pgvector (simulated for MySQL)
- [x] Implement agent discovery endpoints
- [x] Add HNSW indexes for fast vector search (documented for PostgreSQL migration)

## Approval Workflow
- [x] Create agent submission endpoint
- [x] Implement automatic Jira issue creation on submission
- [x] Build webhook handler for approval/rejection
- [x] Add production deployment trigger on approval
- [x] Implement notification system for status changes
- [x] Create approval history tracking

## Usage Analytics
- [x] Design analytics schema (usage_logs, daily_metrics)
- [x] Implement usage event tracking
- [x] Build aggregation jobs for daily metrics
- [x] Create analytics API endpoints
- [x] Add cost tracking by agent/model
- [x] Build usage dashboard UI

## Testing
- [x] Test complete approval workflow end-to-end
- [x] Test webhook HMAC verification
- [x] Test webhook retry scenarios
- [x] Test semantic search accuracy
- [x] Test analytics aggregation jobs
- [x] Load test agent registry queries

## Documentation
- [ ] Document Jira webhook setup
- [ ] Document approval workflow process
- [ ] Document semantic search API
- [ ] Document analytics schema
