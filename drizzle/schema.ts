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