/**
 * Semantic Search with Vector Embeddings
 * 
 * Provides semantic search capabilities for agent discovery using
 * vector embeddings. In production, this would use pgvector with HNSW indexes.
 * 
 * For this implementation, we simulate vector search using simple text matching
 * since pgvector requires PostgreSQL (we're using MySQL).
 */

export interface SearchResult {
  agentConfigId: number;
  name: string;
  description: string;
  similarity: number;
  version: string;
  status: string;
}

/**
 * Generate embedding vector for text (simulated)
 * In production, this would call OpenAI embeddings API or similar
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Simulated embedding - in production use OpenAI embeddings
  // For now, return a simple hash-based vector
  const vector = new Array(384).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    vector[i % 384] += charCode;
  }
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Search agents by semantic similarity
 * 
 * In production with PostgreSQL + pgvector:
 * - Use vector column type
 * - Create HNSW index for fast approximate nearest neighbor search
 * - Query: SELECT * FROM agents ORDER BY embedding <=> query_vector LIMIT 10
 * - Performance: <2ms for 100k+ agents with HNSW
 */
export async function searchAgents(
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.5
): Promise<SearchResult[]> {
  const { getDb } = await import('./db');
  const { agentConfigs, agentRegistry } = await import('../drizzle/schema');
  
  const db = await getDb();
  if (!db) return [];
  
  // Get all agents (in production, this would be a vector search query)
  const agents = await db.select({
    id: agentConfigs.id,
    name: agentConfigs.name,
    description: agentConfigs.description,
    agentStatus: agentConfigs.agentStatus,
  }).from(agentConfigs);
  
  // Generate query embedding
  const queryVector = await generateEmbedding(query);
  
  // Calculate similarity for each agent
  const results: SearchResult[] = [];
  
  for (const agent of agents) {
    const text = `${agent.name} ${agent.description || ''}`;
    const agentVector = await generateEmbedding(text);
    const similarity = cosineSimilarity(queryVector, agentVector);
    
    if (similarity >= minSimilarity) {
      results.push({
        agentConfigId: agent.id,
        name: agent.name,
        description: agent.description || '',
        similarity,
        version: '1.0.0',
        status: agent.agentStatus || 'draft',
      });
    }
  }
  
  // Sort by similarity (descending) and limit
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

/**
 * Update agent embedding in registry
 * 
 * In production with pgvector:
 * - Store embedding as vector type
 * - Create HNSW index: CREATE INDEX ON agent_registry USING hnsw (embedding vector_cosine_ops)
 * - Index params: m=16, ef_construction=64 for optimal performance
 */
export async function updateAgentEmbedding(
  agentConfigId: number,
  description: string
): Promise<void> {
  const { getDb } = await import('./db');
  const { agentRegistry } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Generate embedding
  const embedding = await generateEmbedding(description);
  
  // Store as JSON string (in production, use vector type)
  await db.update(agentRegistry)
    .set({ embedding: JSON.stringify(embedding) })
    .where(eq(agentRegistry.agentConfigId, agentConfigId));
}

/**
 * Get similar agents (recommendations)
 */
export async function getSimilarAgents(
  agentConfigId: number,
  limit: number = 5
): Promise<SearchResult[]> {
  const { getDb } = await import('./db');
  const { agentConfigs } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const db = await getDb();
  if (!db) return [];
  
  // Get source agent
  const sourceAgent = await db.select().from(agentConfigs)
    .where(eq(agentConfigs.id, agentConfigId))
    .limit(1);
  
  if (sourceAgent.length === 0) return [];
  
  const source = sourceAgent[0];
  const query = `${source.name} ${source.description || ''}`;
  
  // Search for similar agents
  const results = await searchAgents(query, limit + 1);
  
  // Filter out the source agent itself
  return results.filter(r => r.agentConfigId !== agentConfigId).slice(0, limit);
}
