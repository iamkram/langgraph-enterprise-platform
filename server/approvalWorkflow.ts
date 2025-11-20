import { createJiraClient } from './jira/jiraClient';

/**
 * Approval Workflow
 * 
 * Handles the complete agent approval workflow:
 * 1. User submits agent for approval
 * 2. System creates Jira issue with agent details
 * 3. Approver reviews in Jira and approves/rejects
 * 4. Webhook updates agent status
 * 5. Approved agents are deployed to production
 */

export interface SubmitForApprovalRequest {
  agentConfigId: number;
  submitterEmail: string;
  notes?: string;
}

export interface ApprovalWorkflowResult {
  success: boolean;
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  message: string;
}

/**
 * Submit agent for approval
 * Creates Jira issue and updates agent status to 'pending'
 */
export async function submitAgentForApproval(
  request: SubmitForApprovalRequest
): Promise<ApprovalWorkflowResult> {
  try {
    const { getAgentConfigById, updateAgentConfig, getGeneratedCodeByAgentId } = await import('./db');
    
    // Get agent configuration
    const agent = await getAgentConfigById(request.agentConfigId);
    
    if (!agent) {
      return {
        success: false,
        message: 'Agent not found',
      };
    }
    
    // Check if already submitted
    if (agent.agentStatus === 'pending' || agent.agentStatus === 'approved') {
      return {
        success: false,
        message: `Agent is already ${agent.agentStatus}`,
      };
    }
    
    // Create Jira client
    const jiraClient = createJiraClient();
    
    if (!jiraClient) {
      return {
        success: false,
        message: 'Jira integration not configured',
      };
    }
    
    // Get generated code for attachment
    const codes = await getGeneratedCodeByAgentId(request.agentConfigId);
    const completeCode = codes.find(c => c.codeType === 'complete')?.code || '';
    
    // Create Jira issue
    const issue = await jiraClient.createIssue({
      summary: `Agent Approval Request: ${agent.name}`,
      description: `
**Agent Name:** ${agent.name}

**Description:** ${agent.description || 'N/A'}

**Type:** ${agent.agentType}

**Model:** ${agent.modelName}

**Worker Agents:** ${agent.workerAgents || 'N/A'}

**Security Enabled:** ${agent.securityEnabled ? 'Yes' : 'No'}

**Checkpointing Enabled:** ${agent.checkpointingEnabled ? 'Yes' : 'No'}

**Submitted By:** ${request.submitterEmail}

**Notes:** ${request.notes || 'N/A'}

---

**Review Instructions:**
1. Review the agent configuration above
2. Check the attached generated code
3. Approve or reject this request
4. The system will automatically deploy approved agents to production
      `.trim(),
      issueType: 'Task',
      priority: 'Medium',
      labels: ['agent-approval', 'langgraph'],
    });
    
    // Add generated code as attachment
    if (completeCode) {
      await jiraClient.addAttachment({
        issueKey: issue.key,
        filename: `${agent.name.replace(/\s+/g, '_')}_agent.py`,
        content: Buffer.from(completeCode, 'utf-8'),
        contentType: 'text/x-python',
      });
    }
    
    // Update agent status to pending
    await updateAgentConfig(request.agentConfigId, {
      agentStatus: 'pending' as any,
      jiraIssueKey: issue.key,
    });
    
    const jiraBaseUrl = process.env.JIRA_BASE_URL || '';
    
    return {
      success: true,
      jiraIssueKey: issue.key,
      jiraIssueUrl: `${jiraBaseUrl}/browse/${issue.key}`,
      message: `Agent submitted for approval. Jira issue: ${issue.key}`,
    };
  } catch (error: any) {
    console.error('[Approval Workflow] Submission failed:', error);
    return {
      success: false,
      message: `Failed to submit agent: ${error.message}`,
    };
  }
}

/**
 * Get approval status for an agent
 */
export async function getApprovalStatus(agentConfigId: number): Promise<{
  status: string;
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  approvedBy?: string;
  approvedAt?: Date;
}> {
  const { getAgentConfigById } = await import('./db');
  
  const agent = await getAgentConfigById(agentConfigId);
  
  if (!agent) {
    throw new Error('Agent not found');
  }
  
  const jiraBaseUrl = process.env.JIRA_BASE_URL || '';
  
  return {
    status: agent.agentStatus || 'draft',
    jiraIssueKey: agent.jiraIssueKey || undefined,
    jiraIssueUrl: agent.jiraIssueKey ? `${jiraBaseUrl}/browse/${agent.jiraIssueKey}` : undefined,
  };
}

/**
 * Cancel approval request
 * Transitions Jira issue to cancelled and updates agent status back to draft
 */
export async function cancelApprovalRequest(agentConfigId: number): Promise<ApprovalWorkflowResult> {
  try {
    const { getAgentConfigById, updateAgentConfig } = await import('./db');
    
    const agent = await getAgentConfigById(agentConfigId);
    
    if (!agent) {
      return {
        success: false,
        message: 'Agent not found',
      };
    }
    
    if (agent.agentStatus !== 'pending') {
      return {
        success: false,
        message: 'Agent is not pending approval',
      };
    }
    
    // Update agent status back to draft
    await updateAgentConfig(agentConfigId, {
      agentStatus: 'draft' as any,
      jiraIssueKey: null as any,
    });
    
    // Optionally update Jira issue
    if (agent.jiraIssueKey) {
      const jiraClient = createJiraClient();
      if (jiraClient) {
        await jiraClient.addComment(
          agent.jiraIssueKey,
          'Approval request cancelled by submitter'
        );
      }
    }
    
    return {
      success: true,
      message: 'Approval request cancelled',
    };
  } catch (error: any) {
    console.error('[Approval Workflow] Cancellation failed:', error);
    return {
      success: false,
      message: `Failed to cancel request: ${error.message}`,
    };
  }
}

/**
 * List agents by approval status
 */
export async function listAgentsByStatus(status: string): Promise<any[]> {
  const { getDb } = await import('./db');
  const { agentConfigs } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(agentConfigs).where(eq(agentConfigs.agentStatus, status));
}
