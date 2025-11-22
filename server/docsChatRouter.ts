/**
 * Documentation Chat Router
 * Provides AI-powered Q&A about the AIM platform
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const DOCS_SYSTEM_PROMPT = `You are an expert assistant for the Agentic Integration Maker (AIM) platform. You help users understand how to create, configure, and deploy intelligent agent integrations.

Your knowledge includes:
- **Agent Types**: Supervisor (multi-agent orchestration), Single (standalone agent), Sequential (step-by-step workflow)
- **Templates**: Financial Analysis, Customer Support, Research Assistant, Compliance Monitoring, Data Analyst
- **Workers**: Specialized sub-agents that handle specific tasks within supervisor agents
- **Tools**: Functions that agents can call (API integrations, data fetching, calculations)
- **Security Features**: PII detection, guardrails (jailbreak prevention), checkpointing (state persistence)
- **LangSmith Integration**: Automatic tracing, observability, and performance monitoring for all agent executions
- **Code Generation**: Automatic Python LangGraph code generation from visual configuration

When answering:
- Be concise but comprehensive
- Provide step-by-step instructions when relevant
- Reference specific templates and features
- Use examples to clarify concepts
- Maintain a helpful, professional tone

If asked about features not mentioned above, acknowledge limitations and suggest alternatives.`;

export const docsChatRouter = router({
  chat: publicProcedure
    .input(z.object({
      message: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: DOCS_SYSTEM_PROMPT },
      ];

      // Add conversation history if provided
      if (input.conversationHistory && input.conversationHistory.length > 0) {
        messages.push(...input.conversationHistory);
      }

      // Add current user message
      messages.push({ role: "user", content: input.message });

      // Get LLM response
      const response = await invokeLLM({ messages });

      const assistantMessage = response.choices[0]?.message?.content;

      return {
        message: typeof assistantMessage === 'string' ? assistantMessage : "I'm sorry, I couldn't generate a response.",
        timestamp: Date.now(),
      };
    }),
});
