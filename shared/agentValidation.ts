import { z } from "zod";

// Tool configuration schema
export const toolConfigSchema = z.object({
  name: z.string().min(1, "Tool name is required"),
  description: z.string().min(1, "Tool description is required"),
  parameters: z.record(z.string(), z.any()),
});

// Step 1: Basic Information
export const step1Schema = z.object({
  name: z.string().min(1, "Agent name is required").max(255, "Name too long"),
  description: z.string().optional(),
  agentType: z.enum(["supervisor", "worker", "custom"], {
    message: "Agent type is required",
  }),
});

// Step 2: Worker Configuration
export const step2Schema = z.object({
  workerAgents: z.array(z.string()).optional(),
});

// Step 3: Tool Selection
export const step3Schema = z.object({
  tools: z.array(toolConfigSchema).optional(),
});

// Step 4: Security Settings
export const step4Schema = z.object({
  securityEnabled: z.boolean(),
  checkpointingEnabled: z.boolean(),
  modelName: z.string().min(1, "Model name is required"),
  systemPrompt: z.string().optional(),
  maxIterations: z.number().int().min(1).max(100),
  maxRetries: z.number().int().min(0).max(10),
});

// Complete agent configuration schema
export const agentConfigSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(255),
  description: z.string().optional(),
  agentType: z.enum(["supervisor", "worker", "custom"]),
  workerAgents: z.array(z.string()).optional(),
  tools: z.array(toolConfigSchema).optional(),
  securityEnabled: z.boolean(),
  checkpointingEnabled: z.boolean(),
  modelName: z.string().min(1),
  systemPrompt: z.string().optional(),
  maxIterations: z.number().int().min(1).max(100),
  maxRetries: z.number().int().min(0).max(10),
});

export type AgentConfigInput = z.infer<typeof agentConfigSchema>;
export type ToolConfigInput = z.infer<typeof toolConfigSchema>;
