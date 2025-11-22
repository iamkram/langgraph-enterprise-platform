import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { executionRouter } from "./execution";
import { docsChatRouter } from "./docsChatRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { agentConfigSchema } from "@shared/agentValidation";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  execution: executionRouter,
  docsChat: docsChatRouter,
  
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getAgentConfigsByUserId } = await import("./db");
      return await getAgentConfigsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAgentConfigById } = await import("./db");
        const config = await getAgentConfigById(input.id);
        
        // Verify ownership
        if (config && config.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        return config;
      }),
    
    create: protectedProcedure
      .input(agentConfigSchema)
      .mutation(async ({ input, ctx }) => {
        const { createAgentConfig, saveGeneratedCode } = await import("./db");
        const {
          generateCompleteCode,
          generateSupervisorCode,
          generateWorkerCode,
          generateStateCode,
          generateWorkflowCode,
        } = await import("./codeGeneration");
        
        // Create agent config
        const result = await createAgentConfig(ctx.user.id, {
          name: input.name,
          description: input.description,
          agentType: input.agentType,
          workerAgents: JSON.stringify(input.workerAgents || []),
          tools: JSON.stringify(input.tools || []),
          securityEnabled: input.securityEnabled ? 1 : 0,
          checkpointingEnabled: input.checkpointingEnabled ? 1 : 0,
          modelName: input.modelName,
          systemPrompt: input.systemPrompt,
          maxIterations: input.maxIterations,
          maxRetries: input.maxRetries,
        });
        
        const agentId = Number(result.insertId);
        
        // Generate code
        const completeCode = generateCompleteCode(input);
        const supervisorCode = generateSupervisorCode(input);
        const stateCode = generateStateCode(input);
        const workflowCode = generateWorkflowCode(input);
        
        // Save generated code
        await saveGeneratedCode(agentId, "complete", completeCode);
        await saveGeneratedCode(agentId, "supervisor", supervisorCode);
        await saveGeneratedCode(agentId, "state", stateCode);
        await saveGeneratedCode(agentId, "workflow", workflowCode);
        
        if (input.workerAgents && input.workerAgents.length > 0) {
          const workerCode = generateWorkerCode(input.workerAgents[0], input.tools || []);
          await saveGeneratedCode(agentId, "worker", workerCode);
        }
        
        return { id: agentId, agentId: agentId, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: agentConfigSchema.partial(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentConfigById, updateAgentConfig } = await import("./db");
        
        // Verify ownership
        const existing = await getAgentConfigById(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        await updateAgentConfig(input.id, {
          ...input.data,
          workerAgents: input.data.workerAgents ? JSON.stringify(input.data.workerAgents) : undefined,
          tools: input.data.tools ? JSON.stringify(input.data.tools) : undefined,
          securityEnabled: input.data.securityEnabled !== undefined ? (input.data.securityEnabled ? 1 : 0) : undefined,
          checkpointingEnabled: input.data.checkpointingEnabled !== undefined ? (input.data.checkpointingEnabled ? 1 : 0) : undefined,
        });
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentConfigById, deleteAgentConfig } = await import("./db");
        
        // Verify ownership
        const existing = await getAgentConfigById(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        await deleteAgentConfig(input.id);
        return { success: true };
      }),
    
    getCode: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAgentConfigById, getGeneratedCodeByAgentId } = await import("./db");
        
        // Verify ownership
        const config = await getAgentConfigById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        const codes = await getGeneratedCodeByAgentId(input.id);
        
        return {
          complete: codes.find(c => c.codeType === "complete")?.code,
          supervisor: codes.find(c => c.codeType === "supervisor")?.code,
          worker: codes.find(c => c.codeType === "worker")?.code,
          state: codes.find(c => c.codeType === "state")?.code,
          workflow: codes.find(c => c.codeType === "workflow")?.code,
        };
      }),
    
    generateCode: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAgentConfigById, getGeneratedCodeByAgentId } = await import('./db');
        const config = await getAgentConfigById(input.agentId);
        
        if (!config || config.userId !== ctx.user.id) {
          throw new Error('Unauthorized');
        }
        
        const codes = await getGeneratedCodeByAgentId(input.agentId);
        const mainCode = codes.find(c => c.codeType === 'main');
        return {
          code: mainCode?.code || '',
          language: 'python',
        };
      }),
    
    export: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAgentConfigById } = await import("./db");
        
        // Verify ownership
        const config = await getAgentConfigById(input.id);
        if (!config || config.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        // Return agent configuration as JSON-serializable object
        return {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          agent: {
            name: config.name,
            description: config.description,
            agentType: config.agentType,
            modelName: config.modelName,
            systemPrompt: config.systemPrompt,
            maxIterations: config.maxIterations,
            maxRetries: config.maxRetries,
            workerAgents: JSON.parse(config.workerAgents || '[]'),
            tools: JSON.parse(config.tools || '[]'),
            securityEnabled: config.securityEnabled === 1,
            checkpointingEnabled: config.checkpointingEnabled === 1,
          },
        };
      }),
    
    import: protectedProcedure
      .input(z.object({
        data: z.object({
          version: z.string(),
          agent: agentConfigSchema,
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createAgentConfig, saveGeneratedCode } = await import("./db");
        const {
          generateCompleteCode,
          generateSupervisorCode,
          generateWorkerCode,
          generateStateCode,
          generateWorkflowCode,
        } = await import("./codeGeneration");
        
        const agentData = input.data.agent;
        
        // Create agent config from imported data
        const result = await createAgentConfig(ctx.user.id, {
          name: agentData.name,
          description: agentData.description,
          agentType: agentData.agentType,
          workerAgents: JSON.stringify(agentData.workerAgents || []),
          tools: JSON.stringify(agentData.tools || []),
          securityEnabled: agentData.securityEnabled ? 1 : 0,
          checkpointingEnabled: agentData.checkpointingEnabled ? 1 : 0,
          modelName: agentData.modelName,
          systemPrompt: agentData.systemPrompt,
          maxIterations: agentData.maxIterations,
          maxRetries: agentData.maxRetries,
        });
        
        const agentId = Number(result.insertId);
        
        // Generate code
        const completeCode = generateCompleteCode(agentData);
        const supervisorCode = generateSupervisorCode(agentData);
        const stateCode = generateStateCode(agentData);
        const workflowCode = generateWorkflowCode(agentData);
        
        // Save generated code
        await saveGeneratedCode(agentId, "complete", completeCode);
        await saveGeneratedCode(agentId, "supervisor", supervisorCode);
        await saveGeneratedCode(agentId, "state", stateCode);
        await saveGeneratedCode(agentId, "workflow", workflowCode);
        
        if (agentData.workerAgents && agentData.workerAgents.length > 0) {
          const workerCode = generateWorkerCode(agentData.workerAgents[0], agentData.tools || []);
          await saveGeneratedCode(agentId, "worker", workerCode);
        }
        
        return { id: agentId, agentId: agentId, success: true };
      }),
  }),

  // Approval workflow
  approval: router({
    submit: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { submitAgentForApproval } = await import('./approvalWorkflow');
        return await submitAgentForApproval({
          agentConfigId: input.agentConfigId,
          submitterEmail: ctx.user.email || '',
          notes: input.notes,
        });
      }),
    
    status: protectedProcedure
      .input(z.object({ agentConfigId: z.number() }))
      .query(async ({ input }) => {
        const { getApprovalStatus } = await import('./approvalWorkflow');
        return await getApprovalStatus(input.agentConfigId);
      }),
    
    cancel: protectedProcedure
      .input(z.object({ agentConfigId: z.number() }))
      .mutation(async ({ input }) => {
        const { cancelApprovalRequest } = await import('./approvalWorkflow');
        return await cancelApprovalRequest(input.agentConfigId);
      }),
    
    listByStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        const { listAgentsByStatus } = await import('./approvalWorkflow');
        return await listAgentsByStatus(input.status);
      }),
  }),

  // Analytics
  analytics: router({
    logEvent: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        eventType: z.string(),
        modelName: z.string().optional(),
        tokensUsed: z.number().optional(),
        executionTimeMs: z.number().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { logUsageEvent } = await import('./db');
        await logUsageEvent({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    getDailyMetrics: protectedProcedure
      .input(z.object({
        date: z.string(),
        agentConfigId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getDailyMetrics } = await import('./db');
        return await getDailyMetrics(input.date, input.agentConfigId);
      }),
    
    getUsageByDate: protectedProcedure
      .input(z.object({ 
        startDate: z.date().optional(), 
        endDate: z.date().optional() 
      }))
      .query(async ({ ctx, input }) => {
        const { getUsageByDateRange } = await import('./db');
        return await getUsageByDateRange(
          ctx.user.id, 
          input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          input.endDate || new Date()
        );
      }),
    
    getCostByAgent: protectedProcedure
      .input(z.object({ 
        agentId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional()
      }))
      .query(async ({ input }) => {
        const { getCostByAgent } = await import('./db');
        return await getCostByAgent(
          input.agentId,
          input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          input.endDate || new Date()
        );
      }),
    
    aggregateDaily: protectedProcedure
      .input(z.object({ date: z.string() }))
      .mutation(async ({ input }) => {
        const { aggregateDailyMetrics } = await import('./db');
        await aggregateDailyMetrics(input.date);
        return { success: true };
      }),
  }),

  // Semantic search
  search: router({
    agents: protectedProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional(),
        minSimilarity: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { searchAgents } = await import('./semanticSearch');
        return await searchAgents(input.query, input.limit, input.minSimilarity);
      }),
    
    similar: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getSimilarAgents } = await import('./semanticSearch');
        return await getSimilarAgents(input.agentConfigId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
