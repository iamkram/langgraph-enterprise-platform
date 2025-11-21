import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("Agent Versioning", () => {
  let testAgentId: number;
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  beforeEach(async () => {
    // Create a test agent
    const result = await caller.agents.create({
      name: "Version Test Agent",
      description: "Agent for testing versioning",
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

  it("should create a version snapshot", async () => {
    const result = await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Initial version",
    });

    expect(result).toHaveProperty("versionNumber");
    expect(result.versionNumber).toBe(1);
  });

  it("should retrieve version history", async () => {
    // Create two versions
    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Version 1",
    });
    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Version 2",
    });

    const history = await caller.versions.history({ agentConfigId: testAgentId });

    expect(history).toHaveLength(2);
    expect(history[0]?.versionNumber).toBe(2);
    expect(history[1]?.versionNumber).toBe(1);
  });

  it("should get a specific version", async () => {
    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Test version",
    });

    const version = await caller.versions.get({
      agentConfigId: testAgentId,
      versionNumber: 1,
    });

    expect(version).toBeDefined();
    expect(version?.versionNumber).toBe(1);
    expect(version?.name).toBe("Version Test Agent");
  });

  it("should rollback to a previous version", async () => {
    // Create initial version
    await caller.versions.create({
      agentConfigId: testAgentId,
      changeDescription: "Initial state",
    });

    // Update agent
    await caller.agents.update({
      id: testAgentId,
      data: {
        name: "Updated Agent Name",
        maxIterations: 20,
      },
    });

    // Rollback to version 1
    const result = await caller.versions.rollback({
      agentConfigId: testAgentId,
      versionNumber: 1,
    });

    expect(result.success).toBe(true);

    // Verify agent was rolled back
    const agent = await caller.agents.get({ id: testAgentId });
    expect(agent?.name).toBe("Version Test Agent");
  });

  it("should auto-create version on agent update", async () => {
    // Update agent (should auto-create version)
    await caller.agents.update({
      id: testAgentId,
      data: {
        maxIterations: 15,
      },
    });

    const history = await caller.versions.history({ agentConfigId: testAgentId });
    expect(history.length).toBeGreaterThan(0);
  });
});

describe("Tags Management", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  let testTagId: number;
  let testAgentId: number;

  beforeEach(async () => {
    // Create test tag with unique name
    const tagResult = await caller.tags.create({
      name: `Test Tag ${Date.now()}`,
      color: "#ff0000",
      description: "A test tag",
    });
    testTagId = tagResult.id;

    // Create test agent
    const agentResult = await caller.agents.create({
      name: "Tag Test Agent",
      description: "Agent for testing tags",
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
    testAgentId = agentResult.id;
  });

  it("should create a tag", async () => {
    const result = await caller.tags.create({
      name: `Production ${Date.now()}`,
      color: "#00ff00",
      description: "Production agents",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBeGreaterThan(0);
  });

  it("should list all tags", async () => {
    const tags = await caller.tags.list();

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it("should update a tag", async () => {
    await caller.tags.update({
      id: testTagId,
      name: "Updated Tag",
      color: "#0000ff",
    });

    const tag = await db.getTagById(testTagId);
    expect(tag?.name).toBe("Updated Tag");
    expect(tag?.color).toBe("#0000ff");
  });

  it("should delete a tag", async () => {
    const result = await caller.tags.delete({ id: testTagId });

    expect(result.success).toBe(true);

    const tag = await db.getTagById(testTagId);
    expect(tag).toBeUndefined();
  });

  it("should add tag to agent", async () => {
    const result = await caller.tags.addToAgent({
      agentConfigId: testAgentId,
      tagId: testTagId,
    });

    expect(result.success).toBe(true);

    const agentTags = await caller.tags.getAgentTags({ agentConfigId: testAgentId });
    expect(agentTags.length).toBeGreaterThan(0);
    expect(agentTags.some(t => t.id === testTagId)).toBe(true);
  });

  it("should remove tag from agent", async () => {
    // Add tag first
    await caller.tags.addToAgent({
      agentConfigId: testAgentId,
      tagId: testTagId,
    });

    // Remove tag
    const result = await caller.tags.removeFromAgent({
      agentConfigId: testAgentId,
      tagId: testTagId,
    });

    expect(result.success).toBe(true);

    const agentTags = await caller.tags.getAgentTags({ agentConfigId: testAgentId });
    expect(agentTags.some(t => t.id === testTagId)).toBe(false);
  });

  it("should get agents by tag", async () => {
    await caller.tags.addToAgent({
      agentConfigId: testAgentId,
      tagId: testTagId,
    });

    const agents = await caller.tags.getAgentsByTag({ tagId: testTagId });

    expect(agents.length).toBeGreaterThan(0);
    expect(agents.some(a => a.id === testAgentId)).toBe(true);
  });

  it("should handle duplicate tag additions gracefully", async () => {
    // Add tag twice
    await caller.tags.addToAgent({
      agentConfigId: testAgentId,
      tagId: testTagId,
    });

    const result = await caller.tags.addToAgent({
      agentConfigId: testAgentId,
      tagId: testTagId,
    });

    expect(result.success).toBe(true);
    expect(result.alreadyExists).toBe(true);
  });
});

describe("Bulk Operations", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  let testAgentIds: number[];
  let testTagIds: number[];

  beforeEach(async () => {
    // Create multiple test agents
    testAgentIds = [];
    for (let i = 1; i <= 3; i++) {
      const result = await caller.agents.create({
        name: `Bulk Test Agent ${i}`,
        description: `Agent ${i} for bulk testing`,
        agentType: "supervisor",
        workerAgents: [],
        tools: [],
        securityEnabled: false,
        checkpointingEnabled: false,
        modelName: "gpt-4o",
        systemPrompt: `You are test agent ${i}`,
        maxIterations: 10,
        maxRetries: 3,
      });
      testAgentIds.push(result.id);
    }

    // Create test tags with unique names
    testTagIds = [];
    const timestamp = Date.now();
    for (let i = 1; i <= 2; i++) {
      const result = await caller.tags.create({
        name: `Bulk Tag ${timestamp}-${i}`,
        color: `#00${i}000`,
      });
      testTagIds.push(result.id);
    }
  });

  it("should bulk export agents", async () => {
    const result = await caller.bulk.export({ agentIds: testAgentIds });

    expect(result).toHaveProperty("version");
    expect(result).toHaveProperty("exportedAt");
    expect(result).toHaveProperty("agents");
    expect(result.agents).toHaveLength(3);
    expect(result.agents[0]).toHaveProperty("name");
    expect(result.agents[0]).toHaveProperty("agentType");
  });

  it("should bulk delete agents", async () => {
    const result = await caller.bulk.delete({ agentIds: testAgentIds });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(3);

    // Verify agents are deleted
    for (const id of testAgentIds) {
      const agent = await db.getAgentConfigById(id);
      expect(agent).toBeUndefined();
    }
  });

  it("should bulk add tags to agents", async () => {
    const result = await caller.bulk.addTags({
      agentIds: testAgentIds,
      tagIds: testTagIds,
    });

    expect(result.success).toBe(true);
    expect(result.addedCount).toBe(6); // 3 agents × 2 tags

    // Verify tags were added
    const agentTags = await caller.tags.getAgentTags({ agentConfigId: testAgentIds[0]! });
    expect(agentTags.length).toBeGreaterThanOrEqual(2);
  });

  it("should prevent unauthorized bulk delete", async () => {
    const unauthorizedCtx = createAuthContext(999);
    const unauthorizedCaller = appRouter.createCaller(unauthorizedCtx);

    await expect(
      unauthorizedCaller.bulk.delete({ agentIds: testAgentIds })
    ).rejects.toThrow("Unauthorized");
  });

  it("should handle empty bulk operations", async () => {
    const result = await caller.bulk.export({ agentIds: [] });

    expect(result.agents).toHaveLength(0);
  });
});

describe("Integration Tests", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should support complete workflow: create → tag → version → rollback", async () => {
    // 1. Create agent
    const agentResult = await caller.agents.create({
      name: "Workflow Test Agent",
      description: "Testing complete workflow",
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

    // 2. Create and add tag
    const tagResult = await caller.tags.create({
      name: `Workflow Tag ${Date.now()}`,
      color: "#purple",
    });

    await caller.tags.addToAgent({
      agentConfigId: agentResult.id,
      tagId: tagResult.id,
    });

    // 3. Create version snapshot
    await caller.versions.create({
      agentConfigId: agentResult.id,
      changeDescription: "Before update",
    });

    // 4. Update agent
    await caller.agents.update({
      id: agentResult.id,
      data: {
        systemPrompt: "Updated prompt",
        maxIterations: 20,
      },
    });

    // 5. Rollback
    await caller.versions.rollback({
      agentConfigId: agentResult.id,
      versionNumber: 1,
    });

    // 6. Verify rollback worked
    const agent = await caller.agents.get({ id: agentResult.id });
    expect(agent?.systemPrompt).toBe("Initial prompt");
    expect(agent?.maxIterations).toBe(10);

    // 7. Verify tag still exists
    const agentTags = await caller.tags.getAgentTags({ agentConfigId: agentResult.id });
    expect(agentTags.some(t => t.id === tagResult.id)).toBe(true);
  });
});
