import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Agent configurations table
export const agentConfigs = mysqlTable("agent_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  agentType: varchar("agent_type", { length: 50 }).notNull(), // supervisor, worker, custom
  workerAgents: text("worker_agents"), // JSON array of worker agent names
  tools: text("tools"), // JSON array of tool configurations
  securityEnabled: int("security_enabled").default(1).notNull(), // 1 = true, 0 = false
  checkpointingEnabled: int("checkpointing_enabled").default(1).notNull(), // 1 = true, 0 = false
  modelName: varchar("model_name", { length: 100 }).default("gpt-4o").notNull(),
  systemPrompt: text("system_prompt"),
  maxIterations: int("max_iterations").default(10).notNull(),
  maxRetries: int("max_retries").default(3).notNull(),
  agentStatus: varchar("agent_status", { length: 50 }).default("draft").notNull(), // draft, pending, approved, rejected, production
  jiraIssueKey: varchar("jira_issue_key", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type InsertAgentConfig = typeof agentConfigs.$inferInsert;

// Generated code storage table
export const generatedCode = mysqlTable("generated_code", {
  id: int("id").autoincrement().primaryKey(),
  agentConfigId: int("agent_config_id").notNull().references(() => agentConfigs.id, { onDelete: "cascade" }),
  codeType: varchar("code_type", { length: 50 }).notNull(), // supervisor, worker, state, workflow, complete
  code: text("code").notNull(),
  language: varchar("language", { length: 20 }).default("python").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GeneratedCode = typeof generatedCode.$inferSelect;
export type InsertGeneratedCode = typeof generatedCode.$inferInsert;

// Agent registry table with versioning and status
export const agentRegistry = mysqlTable("agent_registry", {
  id: int("id").autoincrement().primaryKey(),
  agentConfigId: int("agent_config_id").notNull().references(() => agentConfigs.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(), // e.g., "1.0.0", "1.1.0"
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, pending, approved, rejected, production
  jiraIssueKey: varchar("jira_issue_key", { length: 100 }),
  jiraIssueId: varchar("jira_issue_id", { length: 100 }),
  embedding: text("embedding"), // JSON string of vector embedding
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentRegistry = typeof agentRegistry.$inferSelect;
export type InsertAgentRegistry = typeof agentRegistry.$inferInsert;

// Webhook event log
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("event_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  issueKey: varchar("issue_key", { length: 100 }),
  issueId: varchar("issue_id", { length: 100 }),
  status: varchar("status", { length: 50 }),
  payload: text("payload").notNull(),
  processed: int("processed").notNull().default(0), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

// Usage analytics
export const usageLogs = mysqlTable("usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  agentConfigId: int("agent_config_id").notNull().references(() => agentConfigs.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // created, executed, viewed, deleted
  modelName: varchar("model_name", { length: 100 }),
  tokensUsed: int("tokens_used"),
  executionTimeMs: int("execution_time_ms"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

// Daily metrics aggregation
export const dailyMetrics = mysqlTable("daily_metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  agentConfigId: int("agent_config_id").references(() => agentConfigs.id, { onDelete: "cascade" }),
  totalExecutions: int("total_executions").notNull().default(0),
  totalTokens: int("total_tokens").notNull().default(0),
  avgExecutionTimeMs: int("avg_execution_time_ms"),
  uniqueUsers: int("unique_users").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetric = typeof dailyMetrics.$inferInsert;