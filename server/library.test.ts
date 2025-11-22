import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { customTools, customAgents, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Test user IDs
const LIBRARY_TEST_USER_ID = 500;

async function ensureLibraryTestUser(): Promise<AuthenticatedUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, LIBRARY_TEST_USER_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      id: LIBRARY_TEST_USER_ID,
      openId: `library-test-user-${LIBRARY_TEST_USER_ID}`,
      name: "Library Test User",
      email: "library@test.com",
      loginMethod: "test",
      role: "user",
    });
  }

  return {
    id: LIBRARY_TEST_USER_ID,
    openId: `library-test-user-${LIBRARY_TEST_USER_ID}`,
    email: "library@test.com",
    name: "Library Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

async function cleanupLibraryTestData() {
  const db = await getDb();
  if (!db) return;

  await db.delete(customTools).where(eq(customTools.userId, LIBRARY_TEST_USER_ID));
  await db.delete(customAgents).where(eq(customAgents.userId, LIBRARY_TEST_USER_ID));
}

function createLibraryContext(user: AuthenticatedUser): { ctx: TrpcContext } {
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

describe("Library Router", () => {
  let testUser: AuthenticatedUser;

  beforeAll(async () => {
    testUser = await ensureLibraryTestUser();
    await cleanupLibraryTestData();
  });

  describe("saveTool", () => {
    it("should save a custom tool to the library", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.library.saveTool({
        name: "test_search_tool",
        description: "A tool for searching the web",
        parameters: JSON.stringify({
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        }),
        isPublic: true,
        tags: ["search", "web"],
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
    });

    it("should save a private tool", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.library.saveTool({
        name: "private_tool",
        description: "A private tool",
        parameters: JSON.stringify({
          type: "object",
          properties: {},
        }),
        isPublic: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("saveAgent", () => {
    it("should save a custom agent to the library", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.library.saveAgent({
        name: "test_analyst",
        role: "Data Analyst",
        goal: "Analyze data and provide insights",
        backstory: "You are an experienced data analyst with expertise in Python and statistics",
        tools: ["run_python_code", "read_file"],
        allowDelegation: false,
        isPublic: true,
        tags: ["data", "analysis"],
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
    });
  });

  describe("getTools", () => {
    it("should retrieve public tools", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Save a public tool first
      await caller.library.saveTool({
        name: "public_tool",
        description: "A public tool for testing",
        parameters: JSON.stringify({
          type: "object",
          properties: {
            input: { type: "string" },
          },
        }),
        isPublic: true,
      });

      const tools = await caller.library.getTools({
        sortBy: "recent",
        limit: 10,
      });

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toHaveProperty("name");
      expect(tools[0]).toHaveProperty("description");
      expect(tools[0]).toHaveProperty("parameters");
      expect(tools[0]).toHaveProperty("averageRating");
    });

    it("should filter tools by search query", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const tools = await caller.library.getTools({
        search: "search",
        sortBy: "recent",
        limit: 10,
      });

      expect(Array.isArray(tools)).toBe(true);
      // Should find the "test_search_tool" we created earlier
      const searchTool = tools.find((t: any) => t.name === "test_search_tool");
      expect(searchTool).toBeDefined();
    });

    it("should return only user's tools when myOnly is true", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const tools = await caller.library.getTools({
        myOnly: true,
        sortBy: "recent",
        limit: 10,
      });

      expect(Array.isArray(tools)).toBe(true);
      // All tools should belong to the test user
      tools.forEach((tool: any) => {
        expect(tool.userId).toBe(LIBRARY_TEST_USER_ID);
      });
    });
  });

  describe("getAgents", () => {
    it("should retrieve public agents", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const agents = await caller.library.getAgents({
        sortBy: "recent",
        limit: 10,
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents[0]).toHaveProperty("name");
      expect(agents[0]).toHaveProperty("role");
      expect(agents[0]).toHaveProperty("goal");
      expect(agents[0]).toHaveProperty("backstory");
      expect(agents[0]).toHaveProperty("tools");
      expect(agents[0]).toHaveProperty("averageRating");
    });

    it("should filter agents by search query", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const agents = await caller.library.getAgents({
        search: "analyst",
        sortBy: "recent",
        limit: 10,
      });

      expect(Array.isArray(agents)).toBe(true);
      // Should find the "test_analyst" we created earlier
      const analyst = agents.find((a: any) => a.name === "test_analyst");
      expect(analyst).toBeDefined();
    });
  });

  describe("rate", () => {
    it("should rate a tool", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a tool first
      const toolResult = await caller.library.saveTool({
        name: "rateable_tool",
        description: "A tool to rate",
        parameters: JSON.stringify({
          type: "object",
          properties: {},
        }),
        isPublic: true,
      });

      // Rate it
      const rateResult = await caller.library.rate({
        itemType: "tool",
        itemId: toolResult.id,
        rating: 5,
      });

      expect(rateResult.success).toBe(true);

      // Verify rating was applied
      const tools = await caller.library.getTools({
        myOnly: true,
        sortBy: "rating",
        limit: 10,
      });

      const ratedTool = tools.find((t: any) => t.id === toolResult.id);
      expect(ratedTool).toBeDefined();
      expect(ratedTool.averageRating).toBe(5);
    });

    it("should update existing rating", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a tool
      const toolResult = await caller.library.saveTool({
        name: "updateable_rating_tool",
        description: "A tool to update rating",
        parameters: JSON.stringify({
          type: "object",
          properties: {},
        }),
        isPublic: true,
      });

      // Rate it first time
      await caller.library.rate({
        itemType: "tool",
        itemId: toolResult.id,
        rating: 3,
      });

      // Update rating
      await caller.library.rate({
        itemType: "tool",
        itemId: toolResult.id,
        rating: 5,
      });

      // Verify updated rating
      const tools = await caller.library.getTools({
        myOnly: true,
        sortBy: "rating",
        limit: 10,
      });

      const ratedTool = tools.find((t: any) => t.id === toolResult.id);
      expect(ratedTool).toBeDefined();
      expect(ratedTool.averageRating).toBe(5);
    });
  });

  describe("incrementUsage", () => {
    it("should increment tool usage count", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a tool
      const toolResult = await caller.library.saveTool({
        name: "usage_tracked_tool",
        description: "A tool to track usage",
        parameters: JSON.stringify({
          type: "object",
          properties: {},
        }),
        isPublic: true,
      });

      // Increment usage
      await caller.library.incrementUsage({
        itemType: "tool",
        itemId: toolResult.id,
      });

      // Verify usage count
      const tools = await caller.library.getTools({
        myOnly: true,
        sortBy: "popular",
        limit: 10,
      });

      const usedTool = tools.find((t: any) => t.id === toolResult.id);
      expect(usedTool).toBeDefined();
      expect(usedTool.usageCount).toBeGreaterThan(0);
    });
  });

  describe("deleteTool", () => {
    it("should delete own tool", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a tool
      const toolResult = await caller.library.saveTool({
        name: "deletable_tool",
        description: "A tool to delete",
        parameters: JSON.stringify({
          type: "object",
          properties: {},
        }),
        isPublic: true,
      });

      // Delete it
      const deleteResult = await caller.library.deleteTool({
        id: toolResult.id,
      });

      expect(deleteResult.success).toBe(true);

      // Verify it's gone
      const tools = await caller.library.getTools({
        myOnly: true,
        sortBy: "recent",
        limit: 100,
      });

      const deletedTool = tools.find((t: any) => t.id === toolResult.id);
      expect(deletedTool).toBeUndefined();
    });
  });

  describe("deleteAgent", () => {
    it("should delete own agent", async () => {
      const { ctx } = createLibraryContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create an agent
      const agentResult = await caller.library.saveAgent({
        name: "deletable_agent",
        role: "Test Role",
        goal: "Test goal",
        backstory: "Test backstory",
        tools: ["test_tool"],
        allowDelegation: false,
        isPublic: true,
      });

      // Delete it
      const deleteResult = await caller.library.deleteAgent({
        id: agentResult.id,
      });

      expect(deleteResult.success).toBe(true);

      // Verify it's gone
      const agents = await caller.library.getAgents({
        myOnly: true,
        sortBy: "recent",
        limit: 100,
      });

      const deletedAgent = agents.find((a: any) => a.id === agentResult.id);
      expect(deletedAgent).toBeUndefined();
    });
  });
});
