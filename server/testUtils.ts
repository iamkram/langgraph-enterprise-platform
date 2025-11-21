import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { users, agentConfigs } from '../drizzle/schema';

/**
 * Test utilities for database cleanup and test data management
 */

export async function cleanupTestData() {
  const db = await getDb();
  if (!db) {
    console.warn('[Test] Database not available for cleanup');
    return;
  }

  try {
    // Delete agent configs (this should cascade to related data)
    await db.delete(agentConfigs);
    // Don't delete users as they might be needed for auth
    
    console.log('[Test] Database cleanup completed');
  } catch (error) {
    console.error('[Test] Database cleanup failed:', error);
    throw error;
  }
}

export async function cleanupTestUser(openId: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // This will cascade delete related data if foreign keys are set up
    await db.delete(users).where(eq(users.openId, openId));
    console.log(`[Test] Cleaned up test user: ${openId}`);
  } catch (error) {
    console.error('[Test] User cleanup failed:', error);
  }
}

export function createTestAgent(overrides: Partial<any> = {}) {
  return {
    name: 'Test Agent',
    description: 'Test agent description',
    agentType: 'react' as const,
    tools: ['web_search', 'calculator'],
    systemPrompt: 'You are a helpful assistant',
    securityEnabled: false,
    checkpointingEnabled: false,
    modelName: 'gpt-4',
    maxIterations: 10,
    maxRetries: 3,
    workerAgents: [],
    ...overrides,
  };
}

export function createTestSchedule(agentConfigId: number, userId: number, overrides: Partial<any> = {}) {
  return {
    agentConfigId,
    userId,
    name: 'Test Schedule',
    cronExpression: '0 0 * * *',
    input: undefined,
    notifyOnCompletion: 0,
    ...overrides,
  };
}

export function createTestTag(userId: number, overrides: Partial<any> = {}) {
  return {
    userId,
    name: `test-tag-${Date.now()}`,
    color: '#3b82f6',
    ...overrides,
  };
}

// Helper to wait for async operations
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
