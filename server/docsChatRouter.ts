/**
 * Documentation Chat Router
 * Provides AI-powered Q&A about LangGraph, agent creation, and platform features
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { invokeLLM } from './_core/llm';

const DOCUMENTATION_CONTEXT = `
You are a helpful AI assistant for the Agentic Integration Maker (AIM) platform, which helps users create and manage LangGraph-based intelligent agents.

# Platform Overview
AIM is a code generation platform for building multi-agent systems using LangGraph. Users can:
- Create supervisor agents that coordinate multiple worker agents
- Configure tools for agents to use (Microsoft 365, APIs, databases)
- Generate production-ready Python code with security and checkpointing
- Use pre-built templates for common use cases
- Track agent performance with analytics

# Agent Types
1. **Supervisor Agent**: Orchestrates multiple worker agents, routes tasks, and manages workflow
2. **Worker Agent**: Specialized agent that performs specific tasks (e.g., email management, calendar scheduling)
3. **Custom Agent**: Flexible agent type for unique requirements

# Key Features
- **Templates**: Pre-configured agent setups (Financial Analysis, Executive Assistant, Customer Service, Research, etc.)
- **Security Layer**: 3-layer security with PII detection and guardrails
- **Checkpointing**: PostgreSQL-backed state persistence for resumability
- **Code Generation**: Automatic generation of complete LangGraph code including state management, routing logic, and tool integration
- **Analytics**: Track agent executions, token usage, and performance metrics

# Common Questions

**How do I create an agent?**
1. Click "Create New Agent" or use a template
2. Configure basic info (name, type, description)
3. Add worker agents (for supervisor type)
4. Select tools for your agents
5. Configure security and advanced settings
6. Review and generate code

**What are templates?**
Templates are pre-configured agent setups that you can clone and customize. They include:
- Financial Analysis: Market research, portfolio analysis, risk assessment
- Executive Assistant: Email, calendar, tasks, knowledge management
- Customer Service: Ticket routing, response generation, sentiment analysis
- Research Assistant: Literature review, data gathering, report generation

**What tools are available?**
- Microsoft 365 integration (email, calendar, tasks, knowledge base)
- Custom API integrations
- Database operations
- File processing
- Web scraping and data extraction

**How does the supervisor-worker pattern work?**
A supervisor agent receives tasks, analyzes them, and routes to appropriate worker agents. Workers execute specialized tasks and report back. The supervisor aggregates results and provides final output.

**What is checkpointing?**
Checkpointing saves agent state to PostgreSQL, allowing agents to resume from interruptions. Useful for long-running workflows and error recovery.

# Best Practices
- Start with templates for common use cases
- Use supervisor pattern for complex multi-step workflows
- Enable security layer for production deployments
- Configure appropriate max iterations to prevent infinite loops
- Test agents with sample inputs before production use

Answer user questions clearly and concisely. If asked about features not mentioned above, acknowledge the limitation and suggest alternatives.
`;

export const docsChatRouter = router({
  /**
   * Send a message and get AI response about documentation
   */
  sendMessage: publicProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      // Prepend documentation context as system message
      const messagesWithContext = [
        { role: 'system' as const, content: DOCUMENTATION_CONTEXT },
        ...input.messages.filter(m => m.role !== 'system'), // Remove any existing system messages
      ];

      try {
        const response = await invokeLLM({
          messages: messagesWithContext,
        });

        const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        return {
          message: assistantMessage,
          success: true,
        };
      } catch (error) {
        console.error('Documentation chat error:', error);
        throw new Error('Failed to get response from AI assistant');
      }
    }),

  /**
   * Get suggested questions for users
   */
  getSuggestedQuestions: publicProcedure
    .query(() => {
      return [
        "How do I create my first agent?",
        "What's the difference between supervisor and worker agents?",
        "What templates are available?",
        "How does checkpointing work?",
        "What tools can I integrate with my agents?",
        "How do I use the Executive Assistant template?",
      ];
    }),
});
