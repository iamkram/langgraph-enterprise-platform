import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
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
  }),
});

export type AppRouter = typeof appRouter;
