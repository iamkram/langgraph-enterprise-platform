import { Client } from "langsmith";
import { ENV } from "../_core/env";

/**
 * LangSmith Integration Service
 * 
 * Provides centralized access to LangSmith features:
 * - Tracing & Observability
 * - Prompt Management from Hub
 * - Evaluation Framework
 * - Monitoring & Datasets
 */

let _client: Client | null = null;

/**
 * Get or create LangSmith client instance
 */
export function getLangSmithClient(): Client | null {
  // LangSmith API key should be added via webdev_request_secrets
  const apiKey = process.env.LANGSMITH_API_KEY;
  
  if (!apiKey) {
    console.warn("[LangSmith] API key not configured. LangSmith features disabled.");
    return null;
  }

  if (!_client) {
    _client = new Client({
      apiKey,
      // Optional: customize API URL for self-hosted instances
      apiUrl: process.env.LANGSMITH_API_URL,
    });
  }

  return _client;
}

/**
 * Pull a prompt from LangSmith Hub
 * 
 * @param promptIdentifier - Format: "owner/prompt-name" or "owner/prompt-name:version"
 * @param includeModel - Whether to include model configuration
 * @returns Prompt template or null if unavailable
 */
export async function pullPromptFromHub(
  promptIdentifier: string,
  includeModel: boolean = false
): Promise<any | null> {
  const client = getLangSmithClient();
  if (!client) return null;

  try {
    // Note: Use client._pullPrompt() for internal API access
    const prompt = await (client as any).pullPrompt(promptIdentifier, { includeModel });
    console.log(`[LangSmith] Pulled prompt: ${promptIdentifier}`);
    return prompt;
  } catch (error) {
    console.error(`[LangSmith] Failed to pull prompt ${promptIdentifier}:`, error);
    return null;
  }
}

/**
 * Create a traced run for observability
 * 
 * @param name - Name of the run
 * @param runType - Type: "llm", "chain", "tool", "retriever", "prompt"
 * @param inputs - Input data
 * @param projectName - Optional project name (defaults to agent name)
 * @returns Run ID for tracking
 */
export async function createTracedRun(
  name: string,
  runType: "llm" | "chain" | "tool" | "retriever" | "prompt",
  inputs: Record<string, any>,
  projectName?: string
): Promise<string | null> {
  const client = getLangSmithClient();
  if (!client) return null;

  try {
    const run = await client.createRun({
      name,
      run_type: runType,
      inputs,
      project_name: projectName,
      start_time: Date.now(),
    });
    
    return (run as any).id || null;
  } catch (error) {
    console.error(`[LangSmith] Failed to create traced run:`, error);
    return null;
  }
}

/**
 * Update a traced run with outputs and status
 * 
 * @param runId - Run ID from createTracedRun
 * @param outputs - Output data
 * @param error - Optional error message
 */
export async function updateTracedRun(
  runId: string,
  outputs?: Record<string, any>,
  error?: string
): Promise<void> {
  const client = getLangSmithClient();
  if (!client) return;

  try {
    await client.updateRun(runId, {
      outputs,
      error,
      end_time: Date.now(),
    });
  } catch (err) {
    console.error(`[LangSmith] Failed to update traced run:`, err);
  }
}

/**
 * Create a dataset for evaluation
 * 
 * @param datasetName - Name of the dataset
 * @param description - Optional description
 * @returns Dataset ID or null
 */
export async function createDataset(
  datasetName: string,
  description?: string
): Promise<string | null> {
  const client = getLangSmithClient();
  if (!client) return null;

  try {
    const dataset = await client.createDataset(datasetName, { description });
    console.log(`[LangSmith] Created dataset: ${datasetName}`);
    return dataset.id;
  } catch (error) {
    console.error(`[LangSmith] Failed to create dataset:`, error);
    return null;
  }
}

/**
 * Add example to dataset
 * 
 * @param datasetId - Dataset ID
 * @param inputs - Input data
 * @param outputs - Expected output data
 */
export async function addDatasetExample(
  datasetId: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>
): Promise<void> {
  const client = getLangSmithClient();
  if (!client) return;

  try {
    await client.createExample(inputs, outputs, { datasetId });
  } catch (error) {
    console.error(`[LangSmith] Failed to add dataset example:`, error);
  }
}

/**
 * Expert prompts from LangSmith Hub for different agent types
 */
export const LANGSMITH_PROMPTS = {
  // ReAct agent prompt (most popular)
  REACT_AGENT: "hwchase17/react",
  
  // Superagent with sequential function calling
  SUPER_AGENT: "homanp/superagent",
  
  // System prompt generator (meta-prompt)
  SYSTEM_PROMPT_GENERATOR: "ohkgi/superb_system_instruction_prompt",
  
  // Assumption checker for self-checking
  ASSUMPTION_CHECKER: "smithing-gold/assumption-checker",
  
  // ReAct agent scratchpad for thought extraction
  REACT_SCRATCHPAD: "jet-taekyo-lee/tagging-extracting-agent-scratchpad",
  
  // Simple ReAct system prompt
  REACT_SYSTEM: "anandbhaskaran/react-system-prompt",
} as const;

/**
 * Get recommended prompt for agent type
 */
export function getRecommendedPrompt(agentType: "supervisor" | "worker" | "custom"): string {
  switch (agentType) {
    case "supervisor":
      return LANGSMITH_PROMPTS.SUPER_AGENT;
    case "worker":
      return LANGSMITH_PROMPTS.REACT_AGENT;
    case "custom":
      return LANGSMITH_PROMPTS.SYSTEM_PROMPT_GENERATOR;
    default:
      return LANGSMITH_PROMPTS.REACT_AGENT;
  }
}
