import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("agents router", () => {
  it("should create an agent configuration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agents.create({
      name: "Test Agent",
      description: "A test agent",
      agentType: "supervisor",
      workerAgents: ["researcher", "analyst"],
      tools: [
        {
          name: "search_data",
          description: "Search for data",
          parameters: { query: "string" },
        },
      ],
      securityEnabled: true,
      checkpointingEnabled: true,
      modelName: "gpt-4o",
      systemPrompt: "You are a test agent",
      maxIterations: 10,
      maxRetries: 3,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("success", true);
    expect(typeof result.id).toBe("number");
  });

  it("should list agent configurations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agents.list();

    expect(Array.isArray(agents)).toBe(true);
  });

  it("should validate agent name is required", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.agents.create({
        name: "",
        description: "Test",
        agentType: "supervisor",
        securityEnabled: true,
        checkpointingEnabled: true,
        modelName: "gpt-4o",
        maxIterations: 10,
        maxRetries: 3,
      })
    ).rejects.toThrow();
  });

  it("should validate agent type is valid", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.agents.create({
        name: "Test Agent",
        agentType: "invalid" as any,
        securityEnabled: true,
        checkpointingEnabled: true,
        modelName: "gpt-4o",
        maxIterations: 10,
        maxRetries: 3,
      })
    ).rejects.toThrow();
  });
});
