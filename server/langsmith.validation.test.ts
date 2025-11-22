import { describe, expect, it } from "vitest";
import { createTracedRun, updateTracedRun } from "./lib/langsmith";

/**
 * Validation test for LangSmith API credentials
 * Tests that the API key is valid and tracing works end-to-end
 */
describe("LangSmith Integration Validation", () => {
  it("should create and update a traced run successfully", async () => {
    // Create a test run
    const runId = await createTracedRun(
      "Test Run - Credential Validation",
      "chain",
      { test: "validation", timestamp: Date.now() },
      "aim-test",
      { purpose: "credential_validation" }
    );

    // Verify run was created
    expect(runId).toBeTruthy();
    expect(typeof runId).toBe("string");
    
    console.log(`✅ Created LangSmith trace with ID: ${runId}`);

    // Update the run with outputs
    const traceUrl = await updateTracedRun(runId!, {
      outputs: { result: "success", message: "Credentials validated" },
      metadata: { duration: 100, status: "completed" }
    });

    // Verify trace URL was generated
    expect(traceUrl).toBeTruthy();
    expect(traceUrl).toContain("smith.langchain.com");
    
    console.log(`✅ LangSmith trace URL: ${traceUrl}`);
    console.log(`✅ LangSmith credentials are valid and working!`);
  }, 30000); // 30 second timeout for API calls
});
