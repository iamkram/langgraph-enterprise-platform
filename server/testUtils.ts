import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { users, agentConfigs } from '../drizzle/schema';

/**
 * Test utilities for database cleanup and test data management
 */

export async function cleanupTestData(userId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn('[Test] Database not available for cleanup');
    return;
  }

  try {
    if (userId) {
      // Delete only data for specific user
      await db.delete(agentConfigs).where(eq(agentConfigs.userId, userId));
      console.log(`[Test] Database cleanup completed for user ${userId}`);
    } else {
      // Delete all agent configs (use with caution)
      await db.delete(agentConfigs);
      console.log('[Test] Database cleanup completed (all data)');
    }
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

export async function ensureTestUser(userId: number, openId: string, email: string, name: string) {
  const db = await getDb();
  if (!db) {
    console.warn('[Test] Database not available for user creation');
    return;
  }

  try {
    // Insert or update test user
    await db.insert(users).values({
      id: userId,
      openId,
      email,
      name,
      loginMethod: 'manus',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        email,
        name,
        lastSignedIn: new Date(),
      },
    });
    console.log(`[Test] Ensured test user exists: ${openId} (ID: ${userId})`);
  } catch (error) {
    console.error('[Test] Failed to ensure test user:', error);
    throw error;
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
