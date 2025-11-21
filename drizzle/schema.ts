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

// Agent version history table
export const agentVersions = mysqlTable("agent_versions", {
  id: int("id").autoincrement().primaryKey(),
  agentConfigId: int("agent_config_id").notNull().references(() => agentConfigs.id, { onDelete: "cascade" }),
  versionNumber: int("version_number").notNull(), // Incremental version number
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  workerAgents: text("worker_agents"),
  tools: text("tools"),
  securityEnabled: int("security_enabled").notNull(),
  checkpointingEnabled: int("checkpointing_enabled").notNull(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  systemPrompt: text("system_prompt"),
  maxIterations: int("max_iterations").notNull(),
  maxRetries: int("max_retries").notNull(),
  changeDescription: text("change_description"), // What changed in this version
  createdBy: int("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentVersion = typeof agentVersions.$inferSelect;
export type InsertAgentVersion = typeof agentVersions.$inferInsert;

// Tags table
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#3b82f6").notNull(), // Hex color code
  description: text("description"),
  createdBy: int("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

// Agent-Tag junction table (many-to-many)
export const agentTags = mysqlTable("agent_tags", {
  id: int("id").autoincrement().primaryKey(),
  agentConfigId: int("agent_config_id").notNull().references(() => agentConfigs.id, { onDelete: "cascade" }),
  tagId: int("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentTag = typeof agentTags.$inferSelect;

/**
 * Scheduled agent executions table
 */
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  agentConfigId: int("agent_config_id").notNull(),
  userId: int("user_id").notNull(),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  inputData: text("input_data"),
  enabled: int("enabled").default(1).notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Execution history for scheduled agents
 */
export const executionHistory = mysqlTable("execution_history", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("schedule_id").notNull(),
  agentConfigId: int("agent_config_id").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  inputData: text("input_data"),
  outputData: text("output_data"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  duration: int("duration"), // in milliseconds
});

export type ExecutionHistory = typeof executionHistory.$inferSelect;
export type InsertExecutionHistory = typeof executionHistory.$inferInsert;
export type InsertAgentTag = typeof agentTags.$inferInsert;