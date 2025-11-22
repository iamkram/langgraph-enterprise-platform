/**
 * Template Analytics Router
 * API endpoints for template usage tracking, ratings, and marketplace
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import {
  trackTemplateClone,
  markTemplateCompleted,
  markTemplateAbandoned,
  getTemplateStats,
  getAllTemplateStats,
  addTemplateReview,
  getTemplateReviews,
  markReviewHelpful,
  getPopularTemplates,
  getFeaturedTemplates,
} from './lib/templateAnalytics';

export const templateRouter = router({
  /**
   * Track when a user clones a template
   */
  trackClone: protectedProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const usageId = await trackTemplateClone(input.templateId, ctx.user.id);
      return { usageId };
    }),

  /**
   * Mark template usage as completed
   */
  markCompleted: protectedProcedure
    .input(z.object({
      usageId: z.number(),
      agentConfigId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await markTemplateCompleted(input.usageId, input.agentConfigId);
      return { success: true };
    }),

  /**
   * Mark template usage as abandoned
   */
  markAbandoned: protectedProcedure
    .input(z.object({
      usageId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await markTemplateAbandoned(input.usageId);
      return { success: true };
    }),

  /**
   * Get statistics for a specific template
   */
  getStats: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .query(async ({ input }) => {
      return await getTemplateStats(input.templateId);
    }),

  /**
   * Get statistics for all templates
   */
  getAllStats: publicProcedure
    .query(async () => {
      return await getAllTemplateStats();
    }),

  /**
   * Add or update a template review
   */
  addReview: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      rating: z.number().min(1).max(5),
      review: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await addTemplateReview(
        input.templateId,
        ctx.user.id,
        input.rating,
        input.review || null
      );
      return { success: true };
    }),

  /**
   * Get reviews for a template
   */
  getReviews: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .query(async ({ input }) => {
      return await getTemplateReviews(input.templateId);
    }),

  /**
   * Mark a review as helpful
   */
  markHelpful: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await markReviewHelpful(input.reviewId);
      return { success: true };
    }),

  /**
   * Get popular templates (most cloned)
   */
  getPopular: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      return await getPopularTemplates(input.limit);
    }),

  /**
   * Get featured templates
   */
  getFeatured: publicProcedure
    .query(async () => {
      return await getFeaturedTemplates();
    }),
});
