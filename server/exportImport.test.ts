import { describe, expect, it, beforeEach, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ensureTestUser } from "./testUtils";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Use unique user ID for this test suite to avoid conflicts
const EXPORT_IMPORT_TEST_USER_ID = 200;

function createAuthContext(userId: number = EXPORT_IMPORT_TEST_USER_ID): TrpcContext {
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Agent Export/Import", () => {
  let testAgentId: number;
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  beforeAll(async () => {
    // Ensure test user exists in database
    await ensureTestUser(EXPORT_IMPORT_TEST_USER_ID, `test-user-${EXPORT_IMPORT_TEST_USER_ID}`, `user${EXPORT_IMPORT_TEST_USER_ID}@example.com`, `Test User ${EXPORT_IMPORT_TEST_USER_ID}`);
  });

  beforeEach(async () => {
    // Create a test agent
    const result = await caller.agents.create({
      name: "Test Export Agent",
      description: "Agent for testing export/import",
      agentType: "supervisor",
      modelName: "gpt-4o",
      systemPrompt: "You are a test agent",
      maxIterations: 10,
      maxRetries: 3,
      workerAgents: ["worker1", "worker2"],
      tools: [
        {
          name: "test_tool",
          description: "A test tool",
          parameters: {
            type: "object",
            properties: {
              input: { type: "string" },
            },
          },
        },
      ],
      securityEnabled: true,
      checkpointingEnabled: true,
    });

    testAgentId = result.id;
  });

  it("should export agent configuration as JSON", async () => {
    const exported = await caller.agents.export({ id: testAgentId });

    expect(exported).toBeDefined();
    expect(exported.version).toBe("1.0");
    expect(exported.exportedAt).toBeDefined();
    expect(exported.agent).toBeDefined();
    expect(exported.agent.name).toBe("Test Export Agent");
    expect(exported.agent.description).toBe("Agent for testing export/import");
    expect(exported.agent.agentType).toBe("supervisor");
    expect(exported.agent.modelName).toBe("gpt-4o");
    expect(exported.agent.workerAgents).toHaveLength(2);
    expect(exported.agent.tools).toHaveLength(1);
    expect(exported.agent.securityEnabled).toBe(true);
    expect(exported.agent.checkpointingEnabled).toBe(true);
  });

  it("should fail to export agent owned by different user", async () => {
    const otherUserCtx = createAuthContext(999);
    const otherCaller = appRouter.createCaller(otherUserCtx);

    await expect(
      otherCaller.agents.export({ id: testAgentId })
    ).rejects.toThrow("Unauthorized");
  });

  it("should import agent from exported JSON", async () => {
    // First export
    const exported = await caller.agents.export({ id: testAgentId });

    // Then import
    const imported = await caller.agents.import({
      data: exported,
    });

    expect(imported.success).toBe(true);
    expect(imported.id).toBeDefined();
    expect(imported.id).not.toBe(testAgentId); // Should be a new agent

    // Verify imported agent
    const importedAgent = await caller.agents.get({ id: imported.id });
    expect(importedAgent).toBeDefined();
    expect(importedAgent?.name).toBe("Test Export Agent");
    expect(importedAgent?.description).toBe("Agent for testing export/import");
    expect(importedAgent?.agentType).toBe("supervisor");
    expect(importedAgent?.modelName).toBe("gpt-4o");
  });

  it("should preserve all configuration during export/import cycle", async () => {
    // Export
    const exported = await caller.agents.export({ id: testAgentId });

    // Import
    const imported = await caller.agents.import({
      data: exported,
    });

    // Get both agents
    const original = await caller.agents.get({ id: testAgentId });
    const reimported = await caller.agents.get({ id: imported.id });

    // Compare configurations (excluding IDs and timestamps)
    expect(reimported?.name).toBe(original?.name);
    expect(reimported?.description).toBe(original?.description);
    expect(reimported?.agentType).toBe(original?.agentType);
    expect(reimported?.modelName).toBe(original?.modelName);
    expect(reimported?.systemPrompt).toBe(original?.systemPrompt);
    expect(reimported?.maxIterations).toBe(original?.maxIterations);
    expect(reimported?.maxRetries).toBe(original?.maxRetries);
    expect(reimported?.securityEnabled).toBe(original?.securityEnabled);
    expect(reimported?.checkpointingEnabled).toBe(original?.checkpointingEnabled);
    // Compare parsed worker agents
    const originalWorkers = JSON.parse(original?.workerAgents || '[]');
    const reimportedWorkers = JSON.parse(reimported?.workerAgents || '[]');
    expect(reimportedWorkers).toEqual(originalWorkers);
    expect(reimported?.tools).toBe(original?.tools);
  });

  it("should generate code for imported agent", async () => {
    // Export and import
    const exported = await caller.agents.export({ id: testAgentId });
    const imported = await caller.agents.import({ data: exported });

    // Get generated code
    const code = await caller.agents.getCode({ id: imported.id });

    expect(code).toBeDefined();
    expect(code.complete).toBeDefined();
    expect(code.supervisor).toBeDefined();
    expect(code.worker).toBeDefined();
    expect(code.state).toBeDefined();
    expect(code.workflow).toBeDefined();

    // Verify code contains agent name
    expect(code.complete).toContain("Test Export Agent");
  });

  it("should reject invalid import data", async () => {
    await expect(
      caller.agents.import({
        data: {
          version: "1.0",
          agent: {
            // Missing required fields
            name: "",
            agentType: "invalid",
          } as any,
        },
      })
    ).rejects.toThrow();
  });

  it("should handle import of agent with no workers or tools", async () => {
    // Create minimal agent
    const minimal = await caller.agents.create({
      name: "Minimal Agent",
      description: "Agent with no workers or tools",
      agentType: "supervisor",
      modelName: "gpt-4o",
      systemPrompt: "Minimal prompt",
      maxIterations: 5,
      maxRetries: 2,
      workerAgents: [],
      tools: [],
      securityEnabled: false,
      checkpointingEnabled: false,
    });

    // Export and import
    const exported = await caller.agents.export({ id: minimal.id });
    const imported = await caller.agents.import({ data: exported });

    expect(imported.success).toBe(true);

    // Verify
    const reimported = await caller.agents.get({ id: imported.id });
    expect(reimported?.name).toBe("Minimal Agent");
    expect(JSON.parse(reimported?.workerAgents || "[]")).toHaveLength(0);
    expect(JSON.parse(reimported?.tools || "[]")).toHaveLength(0);
  });
});
