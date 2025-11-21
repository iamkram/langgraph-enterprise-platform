import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { executionRouter } from "./execution";
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
        
        return { id: agentId, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: agentConfigSchema.partial(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getAgentConfigById, updateAgentConfig, createAgentVersion } = await import("./db");
        
        // Verify ownership
        const existing = await getAgentConfigById(input.id);
        if (!existing || existing.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        
        // Create version snapshot before updating
        await createAgentVersion(input.id, ctx.user.id, "Agent configuration updated");
        
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
          agent: agentConfigSchema.partial({
            securityEnabled: true,
            checkpointingEnabled: true,
            modelName: true,
            maxIterations: true,
            maxRetries: true,
          }),
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
        
        // Create agent config from imported data with defaults
        const result = await createAgentConfig(ctx.user.id, {
          name: agentData.name,
          description: agentData.description,
          agentType: agentData.agentType,
          workerAgents: JSON.stringify(agentData.workerAgents || []),
          tools: JSON.stringify(agentData.tools || []),
          securityEnabled: agentData.securityEnabled !== undefined ? (agentData.securityEnabled ? 1 : 0) : 0,
          checkpointingEnabled: agentData.checkpointingEnabled !== undefined ? (agentData.checkpointingEnabled ? 1 : 0) : 0,
          modelName: agentData.modelName || 'gpt-4o',
          systemPrompt: agentData.systemPrompt,
          maxIterations: agentData.maxIterations || 10,
          maxRetries: agentData.maxRetries || 3,
        });
        
        const agentId = Number(result.insertId);
        
        // Generate code with defaults filled in
        const completeAgentData = {
          ...agentData,
          securityEnabled: agentData.securityEnabled ?? false,
          checkpointingEnabled: agentData.checkpointingEnabled ?? false,
          modelName: agentData.modelName || 'gpt-4o',
          maxIterations: agentData.maxIterations || 10,
          maxRetries: agentData.maxRetries || 3,
        };
        const completeCode = generateCompleteCode(completeAgentData);
        const supervisorCode = generateSupervisorCode(completeAgentData);
        const stateCode = generateStateCode(completeAgentData);
        const workflowCode = generateWorkflowCode(completeAgentData);
        
        // Save generated code
        await saveGeneratedCode(agentId, "complete", completeCode);
        await saveGeneratedCode(agentId, "supervisor", supervisorCode);
        await saveGeneratedCode(agentId, "state", stateCode);
        await saveGeneratedCode(agentId, "workflow", workflowCode);
        
        if (agentData.workerAgents && agentData.workerAgents.length > 0) {
          const workerCode = generateWorkerCode(agentData.workerAgents[0], agentData.tools || []);
          await saveGeneratedCode(agentId, "worker", workerCode);
        }
        
        return { id: agentId, success: true };
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
    
    aggregateDaily: protectedProcedure
      .input(z.object({ date: z.string() }))
      .mutation(async ({ input }) => {
        const { aggregateDailyMetrics } = await import('./db');
        await aggregateDailyMetrics(input.date);
        return { success: true };
      }),
  }),

  // Agent versioning
  versions: router({
    create: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        changeDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createAgentVersion } = await import('./db');
        return await createAgentVersion(input.agentConfigId, ctx.user.id, input.changeDescription);
      }),
    
    history: protectedProcedure
      .input(z.object({ agentConfigId: z.number() }))
      .query(async ({ input }) => {
        const { getAgentVersionHistory } = await import('./db');
        return await getAgentVersionHistory(input.agentConfigId);
      }),
    
    get: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        versionNumber: z.number(),
      }))
      .query(async ({ input }) => {
        const { getAgentVersion } = await import('./db');
        return await getAgentVersion(input.agentConfigId, input.versionNumber);
      }),
    
    rollback: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        versionNumber: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { rollbackToVersion } = await import('./db');
        return await rollbackToVersion(input.agentConfigId, input.versionNumber, ctx.user.id);
      }),
    
    compare: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        versionNumber1: z.number(),
        versionNumber2: z.number(),
      }))
      .query(async ({ input }) => {
        const { compareVersions } = await import('./db');
        return await compareVersions(input.agentConfigId, input.versionNumber1, input.versionNumber2);
      }),
  }),

  // Tags management
  tags: router({
    list: protectedProcedure.query(async () => {
      const { getAllTags } = await import('./db');
      return await getAllTags();
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(50),
        color: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createTag } = await import('./db');
        return await createTag(input.name, ctx.user.id, input.color, input.description);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateTag } = await import('./db');
        const { id, ...updates } = input;
        await updateTag(id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteTag } = await import('./db');
        await deleteTag(input.id);
        return { success: true };
      }),
    
    addToAgent: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { addTagToAgent } = await import('./db');
        return await addTagToAgent(input.agentConfigId, input.tagId);
      }),
    
    removeFromAgent: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { removeTagFromAgent } = await import('./db');
        await removeTagFromAgent(input.agentConfigId, input.tagId);
        return { success: true };
      }),
    
    getAgentTags: protectedProcedure
      .input(z.object({ agentConfigId: z.number() }))
      .query(async ({ input }) => {
        const { getAgentTags } = await import('./db');
        return await getAgentTags(input.agentConfigId);
      }),
    
    getAgentsByTag: protectedProcedure
      .input(z.object({ tagId: z.number() }))
      .query(async ({ input }) => {
        const { getAgentsByTag } = await import('./db');
        return await getAgentsByTag(input.tagId);
      }),
    
    suggest: protectedProcedure
      .input(z.object({
        agentName: z.string(),
        agentDescription: z.string().optional(),
        agentType: z.string().optional(),
        tools: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const { suggestTagsForAgent } = await import('./db');
        return await suggestTagsForAgent(
          input.agentName,
          input.agentDescription,
          input.agentType,
          input.tools
        );
      }),
  }),

  // Bulk operations
  bulk: router({
    delete: protectedProcedure
      .input(z.object({ agentIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const { bulkDeleteAgents } = await import('./db');
        return await bulkDeleteAgents(input.agentIds, ctx.user.id);
      }),
    
    addTags: protectedProcedure
      .input(z.object({
        agentIds: z.array(z.number()),
        tagIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const { bulkAddTagsToAgents } = await import('./db');
        return await bulkAddTagsToAgents(input.agentIds, input.tagIds);
      }),
    
    export: protectedProcedure
      .input(z.object({ agentIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const { getAgentConfigById } = await import('./db');
        const agents = [];
        
        for (const id of input.agentIds) {
          const config = await getAgentConfigById(id);
          if (config && config.userId === ctx.user.id) {
            agents.push({
              name: config.name,
              description: config.description,
              agentType: config.agentType,
              workerAgents: JSON.parse(config.workerAgents || '[]'),
              tools: JSON.parse(config.tools || '[]'),
              securityEnabled: config.securityEnabled === 1,
              checkpointingEnabled: config.checkpointingEnabled === 1,
              modelName: config.modelName,
              systemPrompt: config.systemPrompt,
              maxIterations: config.maxIterations,
              maxRetries: config.maxRetries,
            });
          }
        }
        
        return {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          agents,
        };
      }),
  }),

  // Schedules management
  schedules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getSchedulesByUser } = await import('./db');
      return await getSchedulesByUser(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        agentConfigId: z.number(),
        name: z.string(),
        cronExpression: z.string(),
        input: z.string().optional(),
        notifyOnCompletion: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createSchedule } = await import('./db');
        return await createSchedule({
          agentConfigId: input.agentConfigId,
          userId: ctx.user.id,
          name: input.name,
          cronExpression: input.cronExpression,
          input: input.input,
          notifyOnCompletion: input.notifyOnCompletion ? 1 : 0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        cronExpression: z.string().optional(),
        input: z.string().optional(),
        isActive: z.number().optional(),
        notifyOnCompletion: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateSchedule } = await import('./db');
        return await updateSchedule(input.id, {
          name: input.name,
          cronExpression: input.cronExpression,
          input: input.input,
          isActive: input.isActive,
          notifyOnCompletion: input.notifyOnCompletion !== undefined ? (input.notifyOnCompletion ? 1 : 0) : undefined,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSchedule } = await import('./db');
        return await deleteSchedule(input.id, ctx.user.id);
      }),
    
    history: protectedProcedure
      .input(z.object({ scheduleId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getExecutionHistory } = await import('./db');
        return await getExecutionHistory(input.scheduleId, input.limit);
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
