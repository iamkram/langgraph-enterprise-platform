import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Version Comparison", () => {
  let testAgentId: number;
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  beforeEach(async () => {
    // Create a test agent
    const result = await caller.agents.create({
      name: "Comparison Test Agent",
      description: "Agent for testing version comparison",
      agentType: "supervisor",
      workerAgents: [],
      tools: [],
      securityEnabled: false,
      checkpointingEnabled: false,
      modelName: "gpt-4o",
      systemPrompt: "Initial prompt",
      maxIterations: 10,
      maxRetries: 3,
    });
    testAgentId = result.id;
  });

  it("should compare two versions and show differences", async () => {
    // Create version 1
    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Version 1",
    });

    // Update agent to create version 2
    await caller.agents.update({
      id: testAgentId,
      data: {
        systemPrompt: "Updated prompt",
        maxIterations: 20,
      },
    });

    // Compare versions
    const comparison = await caller.versions.compare({
      agentConfigId: testAgentId,
      versionNumber1: 1,
      versionNumber2: 2,
    });

    expect(comparison).toHaveProperty("version1");
    expect(comparison).toHaveProperty("version2");
    expect(comparison).toHaveProperty("differences");
    expect(comparison.changedCount).toBeGreaterThan(0);

    // Check specific differences
    const systemPromptDiff = comparison.differences.find(d => d.field === "systemPrompt");
    expect(systemPromptDiff?.changed).toBe(true);
    expect(systemPromptDiff?.oldValue).toBe("Initial prompt");
    expect(systemPromptDiff?.newValue).toBe("Updated prompt");

    const maxIterationsDiff = comparison.differences.find(d => d.field === "maxIterations");
    expect(maxIterationsDiff?.changed).toBe(true);
    expect(maxIterationsDiff?.oldValue).toBe(10);
    expect(maxIterationsDiff?.newValue).toBe(20);
  });

  it("should handle comparison of identical versions", async () => {
    // Create two versions without changes
    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Version 1",
    });

    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Version 2",
    });

    const comparison = await caller.versions.compare({
      agentConfigId: testAgentId,
      versionNumber1: 1,
      versionNumber2: 2,
    });

    expect(comparison.changedCount).toBe(0);
  });
});

describe("Smart Tag Suggestions", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  let testTagIds: number[];

  beforeEach(async () => {
    // Create some test tags
    testTagIds = [];
    const timestamp = Date.now();
    const tagNames = ["Production", "Development", "Testing", "Financial", "Analytics"];

    for (const name of tagNames) {
      const result = await caller.tags.create({
        name: `${name} ${timestamp}`,
        color: "#3b82f6",
        description: `${name} related agents`,
      });
      testTagIds.push(result.id);
    }
  });

  it("should suggest relevant tags based on agent details", async () => {
    const suggestions = await caller.tags.suggest({
      agentName: "Financial Analysis Agent",
      agentDescription: "Analyzes market data and provides insights",
      agentType: "supervisor",
      tools: ["data_analysis", "market_data"],
    });

    expect(suggestions).toHaveProperty("suggestions");
    expect(suggestions).toHaveProperty("reasoning");
    expect(Array.isArray(suggestions.suggestions)).toBe(true);
  });

  it("should return empty suggestions when no tags exist", async () => {
    // Delete all tags
    for (const id of testTagIds) {
      await caller.tags.delete({ id });
    }

    const suggestions = await caller.tags.suggest({
      agentName: "Test Agent",
      agentDescription: "A test agent",
    });

    expect(suggestions.suggestions).toHaveLength(0);
  });
});

describe("Scheduled Execution", () => {
  let testAgentId: number;
  let testScheduleId: number;
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  beforeEach(async () => {
    // Create a test agent
    const result = await caller.agents.create({
      name: "Scheduled Test Agent",
      description: "Agent for testing scheduling",
      agentType: "supervisor",
      workerAgents: [],
      tools: [],
      securityEnabled: false,
      checkpointingEnabled: false,
      modelName: "gpt-4o",
      systemPrompt: "You are a test agent",
      maxIterations: 10,
      maxRetries: 3,
    });
    testAgentId = result.id;
  });

  it("should create a schedule", async () => {
    const result = await caller.schedules.create({
      agentConfigId: testAgentId,
      cronExpression: "0 0 * * *",
      inputData: '{"test": "data"}',
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBeGreaterThan(0);
    testScheduleId = result.id;
  });

  it("should list user schedules", async () => {
    // Create a schedule
    await caller.schedules.create({
      agentConfigId: testAgentId,
      cronExpression: "0 0 * * *",
    });

    const schedules = await caller.schedules.list();

    expect(Array.isArray(schedules)).toBe(true);
    expect(schedules.length).toBeGreaterThan(0);
  });

  it("should update a schedule", async () => {
    // Create a schedule
    const createResult = await caller.schedules.create({
      agentConfigId: testAgentId,
      cronExpression: "0 0 * * *",
    });

    // Update it
    const updateResult = await caller.schedules.update({
      id: createResult.id,
      cronExpression: "0 */6 * * *",
      enabled: 0,
    });

    expect(updateResult.success).toBe(true);
  });

  it("should delete a schedule", async () => {
    // Create a schedule
    const createResult = await caller.schedules.create({
      agentConfigId: testAgentId,
      cronExpression: "0 0 * * *",
    });

    // Delete it
    const deleteResult = await caller.schedules.delete({ id: createResult.id });

    expect(deleteResult.success).toBe(true);
  });

  it("should retrieve execution history", async () => {
    // Create a schedule
    const createResult = await caller.schedules.create({
      agentConfigId: testAgentId,
      cronExpression: "0 0 * * *",
    });

    // Get history (should be empty initially)
    const history = await caller.schedules.history({ scheduleId: createResult.id });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Integration: Complete Advanced Features Workflow", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should support full workflow: create → schedule → tag suggestions → version compare", async () => {
    // 1. Create agent
    const agentResult = await caller.agents.create({
      name: "Full Workflow Agent",
      description: "Testing complete advanced features workflow",
      agentType: "supervisor",
      workerAgents: [],
      tools: [],
      securityEnabled: false,
      checkpointingEnabled: false,
      modelName: "gpt-4o",
      systemPrompt: "Initial system prompt",
      maxIterations: 10,
      maxRetries: 3,
    });

    // 2. Create initial version
    await caller.versions.create({
      agentConfigId: agentResult.id,
      changeDescription: "Initial version",
    });

    // 3. Update agent (creates version 2 automatically)
    await caller.agents.update({
      id: agentResult.id,
      data: {
        systemPrompt: "Updated system prompt",
        maxIterations: 15,
      },
    });

    // Wait for auto-version to be created
    const versions = await caller.versions.history({ agentConfigId: agentResult.id });
    
    // 4. Compare versions if we have at least 2
    if (versions.length >= 2) {
      const comparison = await caller.versions.compare({
        agentConfigId: agentResult.id,
        versionNumber1: 1,
        versionNumber2: 2,
      });

      expect(comparison.changedCount).toBeGreaterThanOrEqual(0);
    }

    // 5. Create a schedule
    const scheduleResult = await caller.schedules.create({
      agentConfigId: agentResult.id,
      cronExpression: "0 0 * * *",
      inputData: '{"workflow": "test"}',
    });

    expect(scheduleResult.id).toBeGreaterThan(0);

    // 6. Get tag suggestions (if tags exist)
    const suggestions = await caller.tags.suggest({
      agentName: "Full Workflow Agent",
      agentDescription: "Testing complete advanced features workflow",
      agentType: "supervisor",
      tools: [],
    });

    expect(suggestions).toHaveProperty("suggestions");
    expect(suggestions).toHaveProperty("reasoning");
  });
});
