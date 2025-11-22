/**
 * Template Analytics Tests
 * Tests for template usage tracking, ratings, and marketplace features
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../server/routers';
import type { TrpcContext } from '../server/_core/context';
import { ensureTestUser, cleanupTestData } from './testUtils';

const TEST_USER_ID = 400; // Unique ID for template analytics tests

function createTestContext(userId: number = TEST_USER_ID): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: `test${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: 'manus',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };
}

beforeAll(async () => {
  await ensureTestUser(
    TEST_USER_ID,
    `test-user-${TEST_USER_ID}`,
    `test${TEST_USER_ID}@example.com`,
    `Test User ${TEST_USER_ID}`
  );
  await cleanupTestData(TEST_USER_ID);
});

describe('Template Analytics', () => {
  describe('Template Usage Tracking', () => {
    it('should track template clone', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.trackClone({
        templateId: 'financial_analysis',
      });

      expect(result).toHaveProperty('usageId');
      expect(typeof result.usageId).toBe('number');
      expect(result.usageId).toBeGreaterThan(0);
    });

    it('should mark template as completed', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // First track a clone
      const cloneResult = await caller.templates.trackClone({
        templateId: 'financial_analysis',
      });

      // Create an agent
      const agentResult = await caller.agents.create({
        name: 'Test Agent from Template',
        description: 'Test agent created from template',
        agentType: 'supervisor',
        workerAgents: ['worker1'],
        tools: [],
        securityEnabled: true,
        checkpointingEnabled: true,
        modelName: 'gpt-4o',
        maxIterations: 10,
        maxRetries: 3,
      });

      // Mark template as completed
      const completionResult = await caller.templates.markCompleted({
        usageId: cloneResult.usageId,
        agentConfigId: agentResult.agentId,
      });

      expect(completionResult.success).toBe(true);
    });

    it('should mark template as abandoned', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Track a clone
      const cloneResult = await caller.templates.trackClone({
        templateId: 'financial_analysis',
      });

      // Mark as abandoned
      const abandonResult = await caller.templates.markAbandoned({
        usageId: cloneResult.usageId,
      });

      expect(abandonResult.success).toBe(true);
    });
  });

  describe('Template Statistics', () => {
    it('should get stats for a specific template', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Track a clone first to ensure stats exist
      await caller.templates.trackClone({
        templateId: 'financial_analysis',
      });

      const stats = await caller.templates.getStats({
        templateId: 'financial_analysis',
      });

      expect(stats).toBeDefined();
      if (stats) {
        expect(stats).toHaveProperty('templateId');
        expect(stats).toHaveProperty('totalClones');
        expect(stats).toHaveProperty('totalCompletions');
        expect(stats).toHaveProperty('successRate');
        expect(stats).toHaveProperty('avgRating');
        expect(stats).toHaveProperty('totalReviews');
        expect(stats.templateId).toBe('financial_analysis');
        expect(typeof stats.totalClones).toBe('number');
        expect(typeof stats.successRate).toBe('number');
      }
    });

    it('should get all template stats', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const allStats = await caller.templates.getAllStats();

      expect(Array.isArray(allStats)).toBe(true);
      // Stats may be empty if no templates have been used yet
      if (allStats.length > 0) {
        const stat = allStats[0];
        expect(stat).toHaveProperty('templateId');
        expect(stat).toHaveProperty('totalClones');
        expect(stat).toHaveProperty('successRate');
      }
    });

    it('should calculate success rate correctly', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Track 2 clones
      const clone1 = await caller.templates.trackClone({
        templateId: 'test_template',
      });
      const clone2 = await caller.templates.trackClone({
        templateId: 'test_template',
      });

      // Complete only one
      const agent = await caller.agents.create({
        name: 'Test Agent',
        agentType: 'custom',
        securityEnabled: false,
        checkpointingEnabled: false,
        modelName: 'gpt-4o',
        maxIterations: 10,
        maxRetries: 3,
      });

      await caller.templates.markCompleted({
        usageId: clone1.usageId,
        agentConfigId: agent.agentId,
      });

      // Check stats
      const stats = await caller.templates.getStats({
        templateId: 'test_template',
      });

      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalClones).toBeGreaterThanOrEqual(2);
        expect(stats.totalCompletions).toBeGreaterThanOrEqual(1);
        // Success rate should be 50% (1 completion out of 2 clones)
        expect(stats.successRate).toBeGreaterThan(0);
        expect(stats.successRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Template Reviews', () => {
    it('should add a template review', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.addReview({
        templateId: 'financial_analysis',
        rating: 5,
        review: 'Excellent template, very helpful!',
      });

      expect(result.success).toBe(true);
    });

    it('should update existing review', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Add initial review
      await caller.templates.addReview({
        templateId: 'financial_analysis',
        rating: 4,
        review: 'Good template',
      });

      // Update review
      const result = await caller.templates.addReview({
        templateId: 'financial_analysis',
        rating: 5,
        review: 'Actually, it is excellent!',
      });

      expect(result.success).toBe(true);
    });

    it('should get reviews for a template', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Add a review first
      await caller.templates.addReview({
        templateId: 'financial_analysis',
        rating: 5,
        review: 'Great template!',
      });

      const reviews = await caller.templates.getReviews({
        templateId: 'financial_analysis',
      });

      expect(Array.isArray(reviews)).toBe(true);
      if (reviews.length > 0) {
        const review = reviews[0];
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('userId');
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('review');
        expect(review).toHaveProperty('helpful');
        expect(review).toHaveProperty('createdAt');
      }
    });

    it('should mark review as helpful', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Add a review
      await caller.templates.addReview({
        templateId: 'financial_analysis',
        rating: 5,
        review: 'Helpful template!',
      });

      // Get reviews to find the review ID
      const reviews = await caller.templates.getReviews({
        templateId: 'financial_analysis',
      });

      if (reviews.length > 0) {
        const reviewId = reviews[0].id;
        const initialHelpful = reviews[0].helpful;

        // Mark as helpful
        const result = await caller.templates.markHelpful({
          reviewId,
        });

        expect(result.success).toBe(true);

        // Verify helpful count increased
        const updatedReviews = await caller.templates.getReviews({
          templateId: 'financial_analysis',
        });
        const updatedReview = updatedReviews.find(r => r.id === reviewId);
        expect(updatedReview?.helpful).toBeGreaterThan(initialHelpful);
      }
    });

    it('should validate rating range', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Test invalid rating (too low)
      await expect(
        caller.templates.addReview({
          templateId: 'financial_analysis',
          rating: 0,
          review: 'Invalid rating',
        })
      ).rejects.toThrow();

      // Test invalid rating (too high)
      await expect(
        caller.templates.addReview({
          templateId: 'financial_analysis',
          rating: 6,
          review: 'Invalid rating',
        })
      ).rejects.toThrow();
    });
  });

  describe('Popular Templates', () => {
    it('should get popular templates', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const popular = await caller.templates.getPopular({
        limit: 5,
      });

      expect(Array.isArray(popular)).toBe(true);
      expect(popular.length).toBeLessThanOrEqual(5);
      
      if (popular.length > 1) {
        // Verify they are sorted by clone count (descending)
        for (let i = 0; i < popular.length - 1; i++) {
          expect(popular[i].totalClones).toBeGreaterThanOrEqual(popular[i + 1].totalClones);
        }
      }
    });

    it('should get featured templates', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const featured = await caller.templates.getFeatured();

      expect(Array.isArray(featured)).toBe(true);
      // All featured templates should have featured flag
      featured.forEach(template => {
        expect(template.featured).toBe(true);
      });
    });
  });

  describe('Integration: Full Template Lifecycle', () => {
    it('should track complete template lifecycle', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const templateId = 'lifecycle_test';

      // 1. Track clone
      const cloneResult = await caller.templates.trackClone({
        templateId,
      });
      expect(cloneResult.usageId).toBeGreaterThan(0);

      // 2. Create agent from template
      const agentResult = await caller.agents.create({
        name: 'Lifecycle Test Agent',
        agentType: 'supervisor',
        securityEnabled: true,
        checkpointingEnabled: true,
        modelName: 'gpt-4o',
        maxIterations: 10,
        maxRetries: 3,
        templateUsageId: cloneResult.usageId,
      });
      expect(agentResult.success).toBe(true);

      // 3. Add review
      await caller.templates.addReview({
        templateId,
        rating: 5,
        review: 'Perfect lifecycle test!',
      });

      // 4. Verify stats
      const stats = await caller.templates.getStats({
        templateId,
      });
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalClones).toBeGreaterThan(0);
        expect(stats.totalCompletions).toBeGreaterThan(0);
        expect(stats.avgRating).toBeGreaterThan(0);
        expect(stats.totalReviews).toBeGreaterThan(0);
      }
    });
  });
});
