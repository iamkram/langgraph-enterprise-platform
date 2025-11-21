import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agentConfigs, generatedCode, InsertAgentConfig, webhookEvents, usageLogs, dailyMetrics, agentVersions, InsertAgentVersion, tags, InsertTag, agentTags, InsertAgentTag } from "../drizzle/schema";
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

// ===== Agent Versioning Functions =====

export async function createAgentVersion(agentConfigId: number, userId: number, changeDescription?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current agent config
  const config = await getAgentConfigById(agentConfigId);
  if (!config) throw new Error("Agent config not found");
  
  // Get the latest version number
  const versions = await db.select().from(agentVersions)
    .where(eq(agentVersions.agentConfigId, agentConfigId))
    .orderBy(agentVersions.versionNumber);
  
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;
  const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
  
  // Create version snapshot
  await db.insert(agentVersions).values({
    agentConfigId,
    versionNumber: newVersionNumber,
    name: config.name,
    description: config.description,
    agentType: config.agentType,
    workerAgents: config.workerAgents,
    tools: config.tools,
    securityEnabled: config.securityEnabled,
    checkpointingEnabled: config.checkpointingEnabled,
    modelName: config.modelName,
    systemPrompt: config.systemPrompt,
    maxIterations: config.maxIterations,
    maxRetries: config.maxRetries,
    changeDescription,
    createdBy: userId,
  });
  
  return { versionNumber: newVersionNumber };
}

export async function getAgentVersionHistory(agentConfigId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { desc } = await import('drizzle-orm');
  return await db.select().from(agentVersions)
    .where(eq(agentVersions.agentConfigId, agentConfigId))
    .orderBy(desc(agentVersions.versionNumber));
}

export async function getAgentVersion(agentConfigId: number, versionNumber: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { and } = await import('drizzle-orm');
  const result = await db.select().from(agentVersions)
    .where(and(
      eq(agentVersions.agentConfigId, agentConfigId),
      eq(agentVersions.versionNumber, versionNumber)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function rollbackToVersion(agentConfigId: number, versionNumber: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the version to rollback to
  const version = await getAgentVersion(agentConfigId, versionNumber);
  if (!version) throw new Error("Version not found");
  
  // Create a new version with current state before rollback
  await createAgentVersion(agentConfigId, userId, `Rollback to version ${versionNumber}`);
  
  // Update agent config with version data
  await updateAgentConfig(agentConfigId, {
    name: version.name,
    description: version.description,
    agentType: version.agentType,
    workerAgents: version.workerAgents,
    tools: version.tools,
    securityEnabled: version.securityEnabled,
    checkpointingEnabled: version.checkpointingEnabled,
    modelName: version.modelName,
    systemPrompt: version.systemPrompt,
    maxIterations: version.maxIterations,
    maxRetries: version.maxRetries,
  });
  
  return { success: true };
}

// ===== Tags Functions =====

export async function createTag(name: string, userId: number, color?: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tags).values({
    name,
    color: color || "#3b82f6",
    description,
    createdBy: userId,
  });
  
  return { id: Number((result as any)[0]?.insertId || (result as any).insertId || 0) };
}

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tags);
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTag(id: number, updates: { name?: string; color?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tags).set(updates).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tags).where(eq(tags.id, id));
}

export async function addTagToAgent(agentConfigId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already exists
  const { and } = await import('drizzle-orm');
  const existing = await db.select().from(agentTags)
    .where(and(
      eq(agentTags.agentConfigId, agentConfigId),
      eq(agentTags.tagId, tagId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return { success: true, alreadyExists: true };
  }
  
  await db.insert(agentTags).values({
    agentConfigId,
    tagId,
  });
  
  return { success: true, alreadyExists: false };
}

export async function removeTagFromAgent(agentConfigId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { and } = await import('drizzle-orm');
  await db.delete(agentTags)
    .where(and(
      eq(agentTags.agentConfigId, agentConfigId),
      eq(agentTags.tagId, tagId)
    ));
}

export async function getAgentTags(agentConfigId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Join agentTags with tags to get full tag info
  const result = await db.select({
    id: tags.id,
    name: tags.name,
    color: tags.color,
    description: tags.description,
  })
  .from(agentTags)
  .innerJoin(tags, eq(agentTags.tagId, tags.id))
  .where(eq(agentTags.agentConfigId, agentConfigId));
  
  return result;
}

export async function getAgentsByTag(tagId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Join agentTags with agentConfigs
  const result = await db.select({
    id: agentConfigs.id,
    name: agentConfigs.name,
    description: agentConfigs.description,
    agentType: agentConfigs.agentType,
  })
  .from(agentTags)
  .innerJoin(agentConfigs, eq(agentTags.agentConfigId, agentConfigs.id))
  .where(eq(agentTags.tagId, tagId));
  
  return result;
}

export async function bulkDeleteAgents(agentIds: number[], userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { inArray } = await import('drizzle-orm');
  
  // Verify ownership for all agents
  const agents = await db.select().from(agentConfigs)
    .where(inArray(agentConfigs.id, agentIds));
  
  const unauthorized = agents.filter(a => a.userId !== userId);
  if (unauthorized.length > 0) {
    throw new Error("Unauthorized to delete some agents");
  }
  
  // Delete all agents
  await db.delete(agentConfigs).where(inArray(agentConfigs.id, agentIds));
  
  return { success: true, deletedCount: agentIds.length };
}

export async function bulkAddTagsToAgents(agentIds: number[], tagIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Create all combinations
  const values: InsertAgentTag[] = [];
  for (const agentId of agentIds) {
    for (const tagId of tagIds) {
      values.push({
        agentConfigId: agentId,
        tagId,
      });
    }
  }
  
  if (values.length > 0) {
    // Insert and ignore duplicates
    for (const value of values) {
      try {
        await db.insert(agentTags).values(value);
      } catch (error) {
        // Ignore duplicate key errors
        if (!(error as any).message?.includes('Duplicate')) {
          throw error;
        }
      }
    }
  }
  
  return { success: true, addedCount: values.length };
}
