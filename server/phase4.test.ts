import { describe, expect, it } from "vitest";
import { verifyJiraWebhookSignature } from "./jira/webhookVerification";
import { searchAgents, cosineSimilarity, generateEmbedding } from "./semanticSearch";

/**
 * Phase 4 Test Suite
 * 
 * Tests for Jira integration, semantic search, approval workflows, and analytics.
 */

describe("Jira Webhook HMAC Verification", () => {
  it("should verify valid HMAC signature", () => {
    const payload = JSON.stringify({ test: "data" });
    const secret = "test-secret";
    
    // Generate valid signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const signature = `sha256=${hmac.digest('hex')}`;
    
    const isValid = verifyJiraWebhookSignature(payload, signature, secret, 'sha256');
    expect(isValid).toBe(true);
  });
  
  it("should reject invalid HMAC signature", () => {
    const payload = JSON.stringify({ test: "data" });
    const secret = "test-secret";
    const invalidSignature = "sha256=invalid";
    
    const isValid = verifyJiraWebhookSignature(payload, invalidSignature, secret, 'sha256');
    expect(isValid).toBe(false);
  });
  
  it("should reject signature with wrong algorithm", () => {
    const payload = JSON.stringify({ test: "data" });
    const secret = "test-secret";
    const signature = "sha1=somehash";
    
    const isValid = verifyJiraWebhookSignature(payload, signature, secret, 'sha256');
    expect(isValid).toBe(false);
  });
  
  it("should reject empty signature", () => {
    const payload = JSON.stringify({ test: "data" });
    const secret = "test-secret";
    
    const isValid = verifyJiraWebhookSignature(payload, "", secret, 'sha256');
    expect(isValid).toBe(false);
  });
});

describe("Semantic Search", () => {
  it("should generate embedding vector", async () => {
    const text = "financial analysis agent";
    const embedding = await generateEmbedding(text);
    
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(384);
    expect(embedding.every(v => typeof v === 'number')).toBe(true);
  });
  
  it("should calculate cosine similarity", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    
    expect(similarity).toBeCloseTo(1.0, 5);
  });
  
  it("should calculate zero similarity for orthogonal vectors", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const similarity = cosineSimilarity(vec1, vec2);
    
    expect(similarity).toBeCloseTo(0.0, 5);
  });
  
  it("should throw error for vectors of different lengths", () => {
    const vec1 = [1, 0];
    const vec2 = [1, 0, 0];
    
    expect(() => cosineSimilarity(vec1, vec2)).toThrow();
  });
});

describe("Approval Workflow", () => {
  it("should have submit function", async () => {
    const { submitAgentForApproval } = await import('./approvalWorkflow');
    expect(typeof submitAgentForApproval).toBe('function');
  });
  
  it("should have status check function", async () => {
    const { getApprovalStatus } = await import('./approvalWorkflow');
    expect(typeof getApprovalStatus).toBe('function');
  });
  
  it("should have cancel function", async () => {
    const { cancelApprovalRequest } = await import('./approvalWorkflow');
    expect(typeof cancelApprovalRequest).toBe('function');
  });
});

describe("Analytics", () => {
  it("should have usage logging function", async () => {
    const { logUsageEvent } = await import('./db');
    expect(typeof logUsageEvent).toBe('function');
  });
  
  it("should have metrics retrieval function", async () => {
    const { getDailyMetrics } = await import('./db');
    expect(typeof getDailyMetrics).toBe('function');
  });
  
  it("should have aggregation function", async () => {
    const { aggregateDailyMetrics } = await import('./db');
    expect(typeof aggregateDailyMetrics).toBe('function');
  });
});
