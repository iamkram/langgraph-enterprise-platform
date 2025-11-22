import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agentConfigs, generatedCode, InsertAgentConfig, webhookEvents, usageLogs, dailyMetrics } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Agent configuration queries
export async function createAgentConfig(userId: number, config: Omit<InsertAgentConfig, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(agentConfigs).values({
    ...config,
    userId,
  });
  
  // MySQL2 returns insertId in result object
  const insertId = Number((result as any)[0]?.insertId || (result as any).insertId || 0);
  
  if (!insertId) {
    throw new Error("Failed to get insert ID from database");
  }
  
  return { insertId };
}

export async function getAgentConfigsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(agentConfigs).where(eq(agentConfigs.userId, userId));
}

export async function getAgentConfigById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agentConfigs).where(eq(agentConfigs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAgentConfig(id: number, updates: Partial<InsertAgentConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(agentConfigs).set(updates).where(eq(agentConfigs.id, id));
}

export async function deleteAgentConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(agentConfigs).where(eq(agentConfigs.id, id));
}

// Generated code queries
export async function saveGeneratedCode(agentConfigId: number, codeType: string, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(generatedCode).values({
    agentConfigId,
    codeType,
    code,
    language: "python",
  });
}

export async function getGeneratedCodeByAgentId(agentConfigId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(generatedCode).where(eq(generatedCode.agentConfigId, agentConfigId));
}

// Agent registry and approval functions
export async function updateAgentApprovalStatus(jiraIssueKey: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(agentConfigs)
    .set({ agentStatus: status })
    .where(eq(agentConfigs.jiraIssueKey, jiraIssueKey));
}

export async function getAgentByJiraIssue(jiraIssueKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agentConfigs).where(eq(agentConfigs.jiraIssueKey, jiraIssueKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function logWebhookEvent(event: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(webhookEvents).values({
    eventId: event.id,
    eventType: event.eventType,
    issueKey: event.issueKey,
    issueId: event.issueId,
    status: event.status,
    payload: JSON.stringify(event.payload),
    processed: 1,
  });
}

// Usage analytics functions
export async function logUsageEvent(event: {
  agentConfigId: number;
  userId: number;
  eventType: string;
  modelName?: string;
  tokensUsed?: number;
  executionTimeMs?: number;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(usageLogs).values({
    agentConfigId: event.agentConfigId,
    userId: event.userId,
    eventType: event.eventType,
    modelName: event.modelName,
    tokensUsed: event.tokensUsed,
    executionTimeMs: event.executionTimeMs,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
  });
}

export async function getDailyMetrics(date: string, agentConfigId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (agentConfigId) {
    const { and } = await import('drizzle-orm');
    return await db.select().from(dailyMetrics)
      .where(and(
        eq(dailyMetrics.date, date),
        eq(dailyMetrics.agentConfigId, agentConfigId)
      ));
  }
  
  return await db.select().from(dailyMetrics).where(eq(dailyMetrics.date, date));
}

export async function aggregateDailyMetrics(date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // This would typically use SQL aggregation queries
  // For now, we'll implement a simplified version
  const logs = await db.select().from(usageLogs)
    .where(eq(usageLogs.createdAt, new Date(date)));
  
  // Group by agent and aggregate
  const metrics = new Map<number, any>();
  
  for (const log of logs) {
    const key = log.agentConfigId;
    if (!metrics.has(key)) {
      metrics.set(key, {
        totalExecutions: 0,
        totalTokens: 0,
        totalExecutionTime: 0,
        uniqueUsers: new Set(),
      });
    }
    
    const metric = metrics.get(key)!;
    if (log.eventType === 'executed') {
      metric.totalExecutions++;
      metric.totalTokens += log.tokensUsed || 0;
      metric.totalExecutionTime += log.executionTimeMs || 0;
    }
    metric.uniqueUsers.add(log.userId);
  }
  
  // Insert aggregated metrics
  for (const [agentConfigId, metric] of Array.from(metrics.entries())) {
    await db.insert(dailyMetrics).values({
      date,
      agentConfigId,
      totalExecutions: metric.totalExecutions,
      totalTokens: metric.totalTokens,
      avgExecutionTimeMs: metric.totalExecutions > 0 
        ? Math.round(metric.totalExecutionTime / metric.totalExecutions)
        : null,
      uniqueUsers: metric.uniqueUsers.size,
    });
  }
}


export async function getUsageByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select()
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        gte(usageLogs.createdAt, startDate),
        lte(usageLogs.createdAt, endDate)
      )
    )
    .orderBy(desc(usageLogs.createdAt));
  
  return results;
}

export async function getCostByAgent(agentId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalCost: 0, breakdown: [] };
  
  const results = await db
    .select()
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.agentConfigId, agentId),
        gte(usageLogs.createdAt, startDate),
        lte(usageLogs.createdAt, endDate)
      )
    );
  
  // Calculate total cost based on token usage
  // Rough estimate: $0.01 per 1000 tokens
  const totalTokens = results.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
  const totalCost = (totalTokens / 1000) * 0.01;
  
  return {
    totalCost: parseFloat(totalCost.toFixed(4)),
    breakdown: results.map(log => ({
      date: log.createdAt,
      tokens: log.tokensUsed || 0,
      cost: parseFloat((((log.tokensUsed || 0) / 1000) * 0.01).toFixed(4)),
    })),
  };
}
