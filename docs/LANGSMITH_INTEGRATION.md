# LangSmith Integration Guide

## Overview

LangSmith provides comprehensive observability for LangGraph agents with automatic tracing, cost tracking, and performance monitoring.

## Environment Variables

Add these to your ECS task definition or `.env` file:

```bash
LANGSMITH_API_KEY=<your-api-key>
LANGSMITH_PROJECT=langgraph-platform
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

## Automatic Tracing

LangSmith automatically traces all LangChain/LangGraph executions when the environment variables are set. No code changes required.

### What Gets Traced

- Supervisor agent routing decisions
- Worker agent executions
- Tool calls and results
- LLM invocations (prompts, responses, tokens)
- State transitions
- Errors and exceptions

## Cost Tracking

### Model Pricing (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |
| GPT-4-turbo | $10.00 | $30.00 |
| GPT-3.5-turbo | $0.50 | $1.50 |

### Viewing Costs

1. Go to LangSmith dashboard
2. Select your project
3. View "Cost" tab for aggregated costs
4. Filter by date range, agent, or user

## Performance Monitoring

### Key Metrics

- **Latency**: End-to-end execution time
- **Token Usage**: Total tokens per execution
- **Success Rate**: Percentage of successful runs
- **Error Rate**: Percentage of failed runs

### Accessing Metrics

```typescript
// In LangSmith dashboard:
// 1. Go to "Analytics" tab
// 2. Select date range
// 3. View charts for:
//    - Latency distribution
//    - Token usage over time
//    - Success/failure rates
//    - Cost trends
```

## Debugging with Traces

### Viewing Traces

1. Go to LangSmith dashboard
2. Click on "Traces" tab
3. Select a trace to view:
   - Input/output for each step
   - LLM prompts and responses
   - Tool calls and results
   - Execution timeline
   - Token usage breakdown

### Filtering Traces

```typescript
// Filter by:
- Date range
- Status (success/error)
- Agent name
- User ID
- Tags
- Latency threshold
```

## Integration with Phase 3 UI

The agent creation UI automatically configures LangSmith tracing for generated agents:

```python
# Generated code includes:
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "langgraph-platform"
```

## Best Practices

1. **Use Descriptive Project Names**: Separate projects for dev, staging, production
2. **Add Tags**: Tag runs with agent type, user ID, environment
3. **Set Metadata**: Include agent config ID, version, deployment info
4. **Monitor Costs**: Set up alerts for unexpected cost spikes
5. **Review Traces**: Regularly review failed traces to improve agents

## Terraform Configuration

LangSmith environment variables are automatically injected into ECS tasks:

```hcl
environment_variables = {
  LANGSMITH_API_KEY     = var.langsmith_api_key
  LANGSMITH_PROJECT     = "langgraph-platform-${var.environment}"
  LANGCHAIN_TRACING_V2  = "true"
  LANGCHAIN_ENDPOINT    = "https://api.smith.langchain.com"
}
```

## Troubleshooting

### Traces Not Appearing

1. Verify `LANGCHAIN_TRACING_V2=true`
2. Check API key is valid
3. Ensure network connectivity to api.smith.langchain.com
4. Check CloudWatch Logs for errors

### High Costs

1. Review token usage in LangSmith dashboard
2. Optimize prompts to reduce tokens
3. Use cheaper models where appropriate (GPT-4o-mini vs GPT-4o)
4. Implement caching for repeated queries

### Performance Issues

1. Check latency metrics in LangSmith
2. Identify slow steps in trace timeline
3. Optimize tool implementations
4. Consider parallel execution where possible

## Additional Resources

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [LangChain Tracing Guide](https://python.langchain.com/docs/langsmith/tracing)
- [Cost Optimization Tips](https://docs.smith.langchain.com/cost-optimization)
