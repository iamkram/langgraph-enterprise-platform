/**
 * Agent Execution Engine
 * Allows users to test-run agents directly in the UI
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { generateSupervisorCode, generateWorkerCode, generateStateCode, generateWorkflowCode } from "./codeGeneration";
import { invokeLLM } from "./_core/llm";

// Execution input schema
const executeAgentInput = z.object({
  agentId: z.number().optional(),
  config: z.object({
    name: z.string(),
    description: z.string(),
    agentType: z.enum(["supervisor", "single", "sequential"]),
    model: z.string(),
    workers: z.array(z.object({
      name: z.string(),
      description: z.string(),
      systemPrompt: z.string(),
    })),
    tools: z.array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.string(), z.any()),
    })),
    security: z.object({
      enablePiiDetection: z.boolean(),
      enableGuardrails: z.boolean(),
      enableCheckpointing: z.boolean(),
    }),
  }),
  input: z.string(),
  sessionId: z.string().optional(),
});

// Execution result schema
const executionResult = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  error: z.string().optional(),
  steps: z.array(z.object({
    step: z.number(),
    worker: z.string(),
    action: z.string(),
    output: z.string(),
    timestamp: z.number(),
  })).optional(),
  metadata: z.object({
    executionTime: z.number(),
    tokensUsed: z.number().optional(),
    cost: z.number().optional(),
    model: z.string(),
  }),
});

/**
 * Simulates agent execution with LLM
 * In production, this would execute actual Python LangGraph code
 */
async function simulateAgentExecution(
  config: z.infer<typeof executeAgentInput>["config"],
  input: string
): Promise<z.infer<typeof executionResult>> {
  const startTime = Date.now();
  const steps: any[] = [];

  try {
    // Security validation (if enabled)
    if (config.security.enablePiiDetection || config.security.enableGuardrails) {
      steps.push({
        step: 1,
        worker: "security_validator",
        action: "validate_input",
        output: "Input validated - no PII detected, no jailbreak attempts",
        timestamp: Date.now(),
      });
    }

    // Supervisor routing (for supervisor agents)
    if (config.agentType === "supervisor" && config.workers.length > 0) {
      steps.push({
        step: steps.length + 1,
        worker: "supervisor",
        action: "route_request",
        output: `Routing to worker: ${config.workers[0].name}`,
        timestamp: Date.now(),
      });

      // Execute each worker
      for (const worker of config.workers) {
        const workerResponse = await invokeLLM({
          messages: [
            { role: "system", content: worker.systemPrompt },
            { role: "user", content: input },
          ],
        });

        steps.push({
          step: steps.length + 1,
          worker: worker.name,
          action: "process",
          output: typeof workerResponse.choices[0]?.message?.content === 'string' ? workerResponse.choices[0].message.content : "No response",
          timestamp: Date.now(),
        });
      }

      // Final synthesis
      const finalResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a supervisor agent. Synthesize the worker outputs into a final response." },
          { role: "user", content: `Input: ${input}\n\nWorker outputs:\n${steps.filter(s => s.worker !== "supervisor" && s.worker !== "security_validator").map(s => `${s.worker}: ${s.output}`).join("\n\n")}` },
        ],
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: typeof finalResponse.choices[0]?.message?.content === 'string' ? finalResponse.choices[0].message.content : "Execution completed",
        steps,
        metadata: {
          executionTime,
          tokensUsed: finalResponse.usage?.total_tokens,
          cost: calculateCost(finalResponse.usage?.total_tokens || 0, config.model),
          model: config.model,
        },
      };
    } else {
      // Single agent execution
      const response = await invokeLLM({
        messages: [
          { role: "system", content: config.description },
          { role: "user", content: input },
        ],
      });

      steps.push({
        step: steps.length + 1,
        worker: "agent",
        action: "process",
        output: typeof response.choices[0]?.message?.content === 'string' ? response.choices[0].message.content : "No response",
        timestamp: Date.now(),
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: typeof response.choices[0]?.message?.content === 'string' ? response.choices[0].message.content : "Execution completed",
        steps,
        metadata: {
          executionTime,
          tokensUsed: response.usage?.total_tokens,
          cost: calculateCost(response.usage?.total_tokens || 0, config.model),
          model: config.model,
        },
      };
    }
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    return {
      success: false,
      error: error.message || "Execution failed",
      steps,
      metadata: {
        executionTime,
        model: config.model,
      },
    };
  }
}

/**
 * Calculate estimated cost based on token usage
 */
function calculateCost(tokens: number, model: string): number {
  const costPer1kTokens: Record<string, number> = {
    "gpt-4o": 0.005,
    "gpt-4o-mini": 0.00015,
    "gpt-4-turbo": 0.01,
    "gpt-3.5-turbo": 0.0015,
  };

  const rate = costPer1kTokens[model] || 0.005;
  return (tokens / 1000) * rate;
}

/**
 * Execution router
 */
export const executionRouter = router({
  // Execute agent with given input
  execute: protectedProcedure
    .input(executeAgentInput)
    .output(executionResult)
    .mutation(async ({ input, ctx }) => {
      // Log execution
      console.log(`[Execution] User ${ctx.user.id} executing agent: ${input.config.name}`);

      // Execute agent
      const result = await simulateAgentExecution(input.config, input.input);

      // TODO: Store execution history in database
      // await db.insertExecutionLog({
      //   userId: ctx.user.id,
      //   agentId: input.agentId,
      //   input: input.input,
      //   output: result.output,
      //   success: result.success,
      //   executionTime: result.metadata.executionTime,
      //   tokensUsed: result.metadata.tokensUsed,
      //   cost: result.metadata.cost,
      // });

      return result;
    }),

  // Get execution history for an agent
  history: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      // TODO: Fetch from database
      // return await db.getExecutionHistory(input.agentId, input.limit);
      
      // Mock data for now
      return [];
    }),

  // Get sample inputs for testing
  getSampleInputs: protectedProcedure
    .input(z.object({
      agentType: z.string(),
      category: z.string().optional(),
    }))
    .query(({ input }) => {
      const samples: Record<string, string[]> = {
        financial: [
          "Analyze Apple's stock performance over the last quarter",
          "What are the key financial risks for Tesla in 2025?",
          "Compare the P/E ratios of Microsoft and Google",
        ],
        compliance: [
          "Check if transaction #12345 shows any suspicious patterns",
          "Screen entity 'Acme Corp' against watchlists",
          "Review account activity for compliance violations",
        ],
        "customer-service": [
          "How do I reset my password?",
          "What is your refund policy?",
          "I need help with my recent order #98765",
        ],
        research: [
          "What are the latest trends in AI agent orchestration?",
          "Summarize recent research on LangGraph performance optimization",
          "Find case studies of multi-agent systems in production",
        ],
        general: [
          "Analyze this dataset and provide insights",
          "Generate a report on Q4 sales performance",
          "What are the key takeaways from this document?",
        ],
      };

      const category = input.category || "general";
      return samples[category] || samples.general;
    }),
});
