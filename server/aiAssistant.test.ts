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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("aiAssistant.generateTool", () => {
  it("should generate a tool specification from user description", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aiAssistant.generateTool({
      userMessage: "Create a tool that searches for weather information",
    });

    expect(result).toHaveProperty("message");
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
    
    // The LLM might or might not generate a complete spec on first message
    // so we just check the structure is correct
    if (result.toolSpec) {
      expect(result.toolSpec).toHaveProperty("name");
      expect(result.toolSpec).toHaveProperty("description");
      expect(result.toolSpec).toHaveProperty("parameters");
    }
  }, 30000); // 30 second timeout for LLM call

  it("should handle conversation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aiAssistant.generateTool({
      userMessage: "Yes, it should take a city name and return temperature",
      conversationHistory: [
        {
          role: "user",
          content: "Create a weather tool",
        },
        {
          role: "assistant",
          content: "What parameters should the weather tool accept?",
        },
      ],
    });

    expect(result).toHaveProperty("message");
    expect(typeof result.message).toBe("string");
  }, 30000);
});

describe("aiAssistant.generateAgent", () => {
  it("should generate an agent specification from user description", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aiAssistant.generateAgent({
      userMessage: "Create a research agent that gathers information from the web",
      availableTools: ["search_web", "read_document"],
    });

    expect(result).toHaveProperty("message");
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
    
    // The LLM might or might not generate a complete spec on first message
    if (result.agentSpec) {
      expect(result.agentSpec).toHaveProperty("name");
      expect(result.agentSpec).toHaveProperty("role");
      expect(result.agentSpec).toHaveProperty("goal");
      expect(result.agentSpec).toHaveProperty("backstory");
      expect(result.agentSpec).toHaveProperty("tools");
      expect(result.agentSpec).toHaveProperty("allow_delegation");
      expect(Array.isArray(result.agentSpec.tools)).toBe(true);
    }
  }, 30000);

  it("should handle conversation history for agent generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aiAssistant.generateAgent({
      userMessage: "It should be able to search and analyze data",
      conversationHistory: [
        {
          role: "user",
          content: "Create a data analyst agent",
        },
        {
          role: "assistant",
          content: "What capabilities should this agent have?",
        },
      ],
      availableTools: ["search_data", "analyze_data"],
    });

    expect(result).toHaveProperty("message");
    expect(typeof result.message).toBe("string");
  }, 30000);
});
