import { Client, RunTree } from "langsmith";

/**
 * LangSmith Integration Service
 * 
 * Provides centralized access to LangSmith features:
 * - Tracing & Observability with RunTree
 * - Prompt Management from Hub
 * - Evaluation Framework
 * - Monitoring & Datasets
 */

let _client: Client | null = null;

// Store active run trees for updating later
const activeRuns = new Map<string, RunTree>();

/**
 * Get or create LangSmith client instance
 */
export function getLangSmithClient(): Client | null {
  const apiKey = process.env.LANGSMITH_API_KEY;
  
  if (!apiKey) {
    console.warn("[LangSmith] API key not configured. LangSmith features disabled.");
    return null;
  }

  if (!_client) {
    _client = new Client({
      apiKey,
      apiUrl: process.env.LANGSMITH_ENDPOINT,
    });
  }

  return _client;
}

/**
 * Create a traced run for observability using RunTree
 * 
 * @param name - Name of the run
 * @param runType - Type: "llm", "chain", "tool", "retriever", "prompt"
 * @param inputs - Input data
 * @param projectName - Optional project name
 * @param metadata - Optional metadata
 * @returns Run ID for tracking
 */
export async function createTracedRun(
  name: string,
  runType: "llm" | "chain" | "tool" | "retriever" | "prompt",
  inputs: Record<string, any>,
  projectName?: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  const client = getLangSmithClient();
  if (!client) return null;

  try {
    const runTree = new RunTree({
      name,
      run_type: runType,
      inputs,
      project_name: projectName || process.env.LANGSMITH_PROJECT || "default",
      client,
      extra: metadata,
    });
    
    // Post the run to LangSmith
    await runTree.postRun();
    
    // Store for later updates
    activeRuns.set(runTree.id, runTree);
    
    console.log(`[LangSmith] Created trace: ${runTree.id}`);
    return runTree.id;
  } catch (error) {
    console.error(`[LangSmith] Failed to create traced run:`, error);
    return null;
  }
}

/**
 * Update a traced run with outputs and status
 * 
 * @param runId - Run ID from createTracedRun
 * @param data - Update data (outputs, error, endTime, metadata)
 * @returns Trace URL for viewing in LangSmith
 */
export async function updateTracedRun(
  runId: string,
  data: {
    outputs?: Record<string, any>;
    error?: string;
    endTime?: number;
    metadata?: Record<string, any>;
  }
): Promise<string | undefined> {
  const runTree = activeRuns.get(runId);
  if (!runTree) {
    console.warn(`[LangSmith] Run ${runId} not found in active runs`);
    return undefined;
  }

  try {
    // End the run with outputs or error
    if (data.error) {
      runTree.error = data.error;
    }
    
    await runTree.end(data.outputs);
    await runTree.patchRun();
    
    // Clean up from active runs
    activeRuns.delete(runId);
    
    // Generate trace URL
    const orgId = process.env.LANGSMITH_ORG_ID || "default";
    const projectName = process.env.LANGSMITH_PROJECT || "default";
    const traceUrl = `https://smith.langchain.com/o/${orgId}/projects/p/${projectName}/r/${runId}`;
    
    console.log(`[LangSmith] Updated trace: ${traceUrl}`);
    return traceUrl;
  } catch (error) {
    console.error(`[LangSmith] Failed to update traced run:`, error);
    return undefined;
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
 * @returns Example ID or null
 */
export async function addDatasetExample(
  datasetId: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>
): Promise<string | null> {
  const client = getLangSmithClient();
  if (!client) return null;

  try {
    const example = await client.createExample(inputs, outputs, { datasetId });
    return example.id;
  } catch (error) {
    console.error(`[LangSmith] Failed to add dataset example:`, error);
    return null;
  }
}
