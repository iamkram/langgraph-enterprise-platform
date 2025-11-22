/**
 * Template Analytics Service
 * Tracks template usage, ratings, and marketplace statistics
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { templateUsage, templateReviews, templateMetadata } from '../../drizzle/schema';

export interface TemplateStats {
  templateId: string;
  totalClones: number;
  totalCompletions: number;
  successRate: number; // percentage
  avgRating: number;
  totalReviews: number;
  featured: boolean;
  verified: boolean;
  lastUsedAt: Date | null;
}

export interface TemplateReview {
  id: number;
  userId: number;
  userName: string | null;
  rating: number;
  review: string | null;
  helpful: number;
  createdAt: Date;
}

/**
 * Track when a user clones a template
 */
export async function trackTemplateClone(
  templateId: string,
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Insert usage record
  const result = await db.insert(templateUsage).values({
    templateId,
    userId,
    clonedAt: new Date(),
    abandoned: 0,
  });

  const usageId = result[0].insertId;

  // Update template metadata
  await updateTemplateMetadata(templateId);

  return usageId;
}

/**
 * Mark template usage as completed when agent is created
 */
export async function markTemplateCompleted(
  usageId: number,
  agentConfigId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(templateUsage)
    .set({
      completedAt: new Date(),
      agentConfigId,
      abandoned: 0,
    })
    .where(eq(templateUsage.id, usageId));

  // Get template ID to update metadata
  const usage = await db
    .select()
    .from(templateUsage)
    .where(eq(templateUsage.id, usageId))
    .limit(1);

  if (usage.length > 0) {
    await updateTemplateMetadata(usage[0].templateId);
  }
}

/**
 * Mark template usage as abandoned
 */
export async function markTemplateAbandoned(usageId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(templateUsage)
    .set({ abandoned: 1 })
    .where(eq(templateUsage.id, usageId));
}

/**
 * Get template statistics
 */
export async function getTemplateStats(templateId: string): Promise<TemplateStats | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const metadata = await db
    .select()
    .from(templateMetadata)
    .where(eq(templateMetadata.templateId, templateId))
    .limit(1);

  if (metadata.length === 0) {
    // Initialize metadata if it doesn't exist
    await initializeTemplateMetadata(templateId);
    return {
      templateId,
      totalClones: 0,
      totalCompletions: 0,
      successRate: 0,
      avgRating: 0,
      totalReviews: 0,
      featured: false,
      verified: false,
      lastUsedAt: null,
    };
  }

  const meta = metadata[0];
  const successRate = meta.totalClones > 0 
    ? Math.round((meta.totalCompletions / meta.totalClones) * 100) 
    : 0;

  return {
    templateId: meta.templateId,
    totalClones: meta.totalClones,
    totalCompletions: meta.totalCompletions,
    successRate,
    avgRating: meta.avgRating / 100, // Convert back from integer storage
    totalReviews: meta.totalReviews,
    featured: meta.featured === 1,
    verified: meta.verified === 1,
    lastUsedAt: meta.lastUsedAt,
  };
}

/**
 * Get all template stats for marketplace
 */
export async function getAllTemplateStats(): Promise<TemplateStats[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const allMetadata = await db
    .select()
    .from(templateMetadata)
    .orderBy(desc(templateMetadata.totalClones));

  return allMetadata.map(meta => ({
    templateId: meta.templateId,
    totalClones: meta.totalClones,
    totalCompletions: meta.totalCompletions,
    successRate: meta.totalClones > 0 
      ? Math.round((meta.totalCompletions / meta.totalClones) * 100) 
      : 0,
    avgRating: meta.avgRating / 100,
    totalReviews: meta.totalReviews,
    featured: meta.featured === 1,
    verified: meta.verified === 1,
    lastUsedAt: meta.lastUsedAt,
  }));
}

/**
 * Add or update a template review
 */
export async function addTemplateReview(
  templateId: string,
  userId: number,
  rating: number,
  review: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if user already reviewed this template
  const existing = await db
    .select()
    .from(templateReviews)
    .where(
      and(
        eq(templateReviews.templateId, templateId),
        eq(templateReviews.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing review
    await db
      .update(templateReviews)
      .set({ rating, review, updatedAt: new Date() })
      .where(eq(templateReviews.id, existing[0].id));
  } else {
    // Insert new review
    await db.insert(templateReviews).values({
      templateId,
      userId,
      rating,
      review,
    });
  }

  // Update template metadata
  await updateTemplateMetadata(templateId);
}

/**
 * Get reviews for a template
 */
export async function getTemplateReviews(templateId: string): Promise<TemplateReview[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const reviews = await db
    .select({
      id: templateReviews.id,
      userId: templateReviews.userId,
      userName: sql<string | null>`(SELECT name FROM users WHERE users.id = ${templateReviews.userId})`,
      rating: templateReviews.rating,
      review: templateReviews.review,
      helpful: templateReviews.helpful,
      createdAt: templateReviews.createdAt,
    })
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId))
    .orderBy(desc(templateReviews.createdAt));

  return reviews;
}

/**
 * Mark a review as helpful
 */
export async function markReviewHelpful(reviewId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(templateReviews)
    .set({ helpful: sql`${templateReviews.helpful} + 1` })
    .where(eq(templateReviews.id, reviewId));
}

/**
 * Initialize template metadata
 */
async function initializeTemplateMetadata(templateId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(templateMetadata).values({
    templateId,
    featured: 0,
    verified: 0,
    totalClones: 0,
    totalCompletions: 0,
    avgRating: 0,
    totalReviews: 0,
  }).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });
}

/**
 * Update template metadata with latest stats
 */
async function updateTemplateMetadata(templateId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Calculate stats from usage
  const usageStats = await db
    .select({
      totalClones: sql<number>`COUNT(*)`,
      totalCompletions: sql<number>`SUM(CASE WHEN ${templateUsage.completedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      lastUsedAt: sql<Date | null>`MAX(${templateUsage.clonedAt})`,
    })
    .from(templateUsage)
    .where(eq(templateUsage.templateId, templateId));

  // Calculate review stats
  const reviewStats = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${templateReviews.rating}), 0)`,
      totalReviews: sql<number>`COUNT(*)`,
    })
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId));

  const usage = usageStats[0];
  const reviews = reviewStats[0];

  // Update or insert metadata
  await db.insert(templateMetadata).values({
    templateId,
    totalClones: usage.totalClones || 0,
    totalCompletions: usage.totalCompletions || 0,
    avgRating: Math.round((reviews.avgRating || 0) * 100), // Store as integer
    totalReviews: reviews.totalReviews || 0,
    lastUsedAt: usage.lastUsedAt,
    featured: 0,
    verified: 0,
  }).onDuplicateKeyUpdate({
    set: {
      totalClones: usage.totalClones || 0,
      totalCompletions: usage.totalCompletions || 0,
      avgRating: Math.round((reviews.avgRating || 0) * 100),
      totalReviews: reviews.totalReviews || 0,
      lastUsedAt: usage.lastUsedAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get popular templates (most cloned)
 */
export async function getPopularTemplates(limit: number = 10): Promise<TemplateStats[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const popular = await db
    .select()
    .from(templateMetadata)
    .orderBy(desc(templateMetadata.totalClones))
    .limit(limit);

  return popular.map(meta => ({
    templateId: meta.templateId,
    totalClones: meta.totalClones,
    totalCompletions: meta.totalCompletions,
    successRate: meta.totalClones > 0 
      ? Math.round((meta.totalCompletions / meta.totalClones) * 100) 
      : 0,
    avgRating: meta.avgRating / 100,
    totalReviews: meta.totalReviews,
    featured: meta.featured === 1,
    verified: meta.verified === 1,
    lastUsedAt: meta.lastUsedAt,
  }));
}

/**
 * Get featured templates
 */
export async function getFeaturedTemplates(): Promise<TemplateStats[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const featured = await db
    .select()
    .from(templateMetadata)
    .where(eq(templateMetadata.featured, 1))
    .orderBy(desc(templateMetadata.avgRating));

  return featured.map(meta => ({
    templateId: meta.templateId,
    totalClones: meta.totalClones,
    totalCompletions: meta.totalCompletions,
    successRate: meta.totalClones > 0 
      ? Math.round((meta.totalCompletions / meta.totalClones) * 100) 
      : 0,
    avgRating: meta.avgRating / 100,
    totalReviews: meta.totalReviews,
    featured: meta.featured === 1,
    verified: meta.verified === 1,
    lastUsedAt: meta.lastUsedAt,
  }));
}
