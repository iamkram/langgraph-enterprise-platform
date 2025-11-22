import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { customTools, customAgents, ratings } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and, desc, sql, like, or } from "drizzle-orm";

/**
 * Library Router
 * 
 * Manages the custom tools and agents library with search, ratings, and usage tracking.
 */

export const libraryRouter = router({
  // Save a custom tool to the library
  saveTool: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.string(), // JSON string
        isPublic: z.boolean().default(false),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(customTools).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        parameters: input.parameters,
        isPublic: input.isPublic ? 1 : 0,
        tags: input.tags ? JSON.stringify(input.tags) : null,
      });

      return { id: result.insertId, success: true };
    }),

  // Save a custom agent to the library
  saveAgent: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        role: z.string(),
        goal: z.string(),
        backstory: z.string(),
        tools: z.array(z.string()),
        allowDelegation: z.boolean().default(false),
        isPublic: z.boolean().default(false),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [result] = await db.insert(customAgents).values({
        userId: ctx.user.id,
        name: input.name,
        role: input.role,
        goal: input.goal,
        backstory: input.backstory,
        tools: JSON.stringify(input.tools),
        allowDelegation: input.allowDelegation ? 1 : 0,
        isPublic: input.isPublic ? 1 : 0,
        tags: input.tags ? JSON.stringify(input.tags) : null,
      });

      return { id: result.insertId, success: true };
    }),

  // Get custom tools with search and filters
  getTools: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        myOnly: z.boolean().default(false),
        sortBy: z.enum(["recent", "popular", "rating"]).default("recent"),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(customTools);

      // Filter by user if myOnly is true
      if (input.myOnly && ctx.user) {
        query = query.where(eq(customTools.userId, ctx.user.id)) as any;
      } else {
        // Show public tools or user's own tools
        if (ctx.user) {
          query = query.where(
            or(
              eq(customTools.isPublic, 1),
              eq(customTools.userId, ctx.user.id)
            )
          ) as any;
        } else {
          query = query.where(eq(customTools.isPublic, 1)) as any;
        }
      }

      // Search by name or description
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          or(
            like(customTools.name, searchTerm),
            like(customTools.description, searchTerm)
          )
        ) as any;
      }

      // Sort
      if (input.sortBy === "popular") {
        query = query.orderBy(desc(customTools.usageCount)) as any;
      } else if (input.sortBy === "rating") {
        query = query.orderBy(desc(sql`${customTools.rating} / NULLIF(${customTools.ratingCount}, 0)`)) as any;
      } else {
        query = query.orderBy(desc(customTools.createdAt)) as any;
      }

      const tools = await query.limit(input.limit);

      return tools.map((tool) => ({
        ...tool,
        parameters: JSON.parse(tool.parameters),
        tags: tool.tags ? JSON.parse(tool.tags) : [],
        averageRating: tool.ratingCount > 0 ? tool.rating / tool.ratingCount : 0,
        isPublic: tool.isPublic === 1,
      }));
    }),

  // Get custom agents with search and filters
  getAgents: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        myOnly: z.boolean().default(false),
        sortBy: z.enum(["recent", "popular", "rating"]).default("recent"),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(customAgents);

      // Filter by user if myOnly is true
      if (input.myOnly && ctx.user) {
        query = query.where(eq(customAgents.userId, ctx.user.id)) as any;
      } else {
        // Show public agents or user's own agents
        if (ctx.user) {
          query = query.where(
            or(
              eq(customAgents.isPublic, 1),
              eq(customAgents.userId, ctx.user.id)
            )
          ) as any;
        } else {
          query = query.where(eq(customAgents.isPublic, 1)) as any;
        }
      }

      // Search by name, role, or goal
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        query = query.where(
          or(
            like(customAgents.name, searchTerm),
            like(customAgents.role, searchTerm),
            like(customAgents.goal, searchTerm)
          )
        ) as any;
      }

      // Sort
      if (input.sortBy === "popular") {
        query = query.orderBy(desc(customAgents.usageCount)) as any;
      } else if (input.sortBy === "rating") {
        query = query.orderBy(desc(sql`${customAgents.rating} / NULLIF(${customAgents.ratingCount}, 0)`)) as any;
      } else {
        query = query.orderBy(desc(customAgents.createdAt)) as any;
      }

      const agents = await query.limit(input.limit);

      return agents.map((agent) => ({
        ...agent,
        tools: JSON.parse(agent.tools),
        tags: agent.tags ? JSON.parse(agent.tags) : [],
        averageRating: agent.ratingCount > 0 ? agent.rating / agent.ratingCount : 0,
        allowDelegation: agent.allowDelegation === 1,
        isPublic: agent.isPublic === 1,
      }));
    }),

  // Rate a tool or agent
  rate: protectedProcedure
    .input(
      z.object({
        itemType: z.enum(["tool", "agent"]),
        itemId: z.number(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user already rated this item
      const existingRating = await db
        .select()
        .from(ratings)
        .where(
          and(
            eq(ratings.userId, ctx.user.id),
            eq(ratings.itemType, input.itemType),
            eq(ratings.itemId, input.itemId)
          )
        )
        .limit(1);

      const table = input.itemType === "tool" ? customTools : customAgents;

      if (existingRating.length > 0) {
        // Update existing rating
        const oldRating = existingRating[0]!.rating;
        const ratingDiff = input.rating - oldRating;

        await db
          .update(ratings)
          .set({ rating: input.rating })
          .where(eq(ratings.id, existingRating[0]!.id));

        await db
          .update(table)
          .set({
            rating: sql`${table.rating} + ${ratingDiff}`,
          })
          .where(eq(table.id, input.itemId));
      } else {
        // Insert new rating
        await db.insert(ratings).values({
          userId: ctx.user.id,
          itemType: input.itemType,
          itemId: input.itemId,
          rating: input.rating,
        });

        await db
          .update(table)
          .set({
            rating: sql`${table.rating} + ${input.rating}`,
            ratingCount: sql`${table.ratingCount} + 1`,
          })
          .where(eq(table.id, input.itemId));
      }

      return { success: true };
    }),

  // Increment usage count when a tool/agent is used
  incrementUsage: protectedProcedure
    .input(
      z.object({
        itemType: z.enum(["tool", "agent"]),
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const table = input.itemType === "tool" ? customTools : customAgents;

      await db
        .update(table)
        .set({
          usageCount: sql`${table.usageCount} + 1`,
        })
        .where(eq(table.id, input.itemId));

      return { success: true };
    }),

  // Delete a custom tool (only owner can delete)
  deleteTool: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const tool = await db
        .select()
        .from(customTools)
        .where(eq(customTools.id, input.id))
        .limit(1);

      if (tool.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tool not found" });
      }

      if (tool[0]!.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own tools" });
      }

      await db.delete(customTools).where(eq(customTools.id, input.id));

      return { success: true };
    }),

  // Delete a custom agent (only owner can delete)
  deleteAgent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const agent = await db
        .select()
        .from(customAgents)
        .where(eq(customAgents.id, input.id))
        .limit(1);

      if (agent.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      if (agent[0]!.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own agents" });
      }

      await db.delete(customAgents).where(eq(customAgents.id, input.id));

      return { success: true };
    }),
});
