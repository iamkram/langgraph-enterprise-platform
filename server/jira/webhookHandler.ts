import { parseJiraWebhookEvent } from './webhookVerification';

/**
 * Jira Webhook Handler
 * 
 * Processes incoming webhook events from Jira with retry logic
 * and status update handling.
 */

export interface WebhookEvent {
  id: string;
  eventType: string;
  issueKey: string;
  issueId: string;
  status: string;
  timestamp: Date;
  payload: any;
}

export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Process Jira webhook event
 */
export async function processJiraWebhook(
  body: any,
  retryConfig: WebhookRetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ success: boolean; event: WebhookEvent | null }> {
  try {
    const event = parseJiraWebhookEvent(body);
    
    const webhookEvent: WebhookEvent = {
      id: `${event.issueKey}-${Date.now()}`,
      eventType: event.eventType,
      issueKey: event.issueKey || '',
      issueId: event.issueId || '',
      status: event.status || '',
      timestamp: new Date(),
      payload: body,
    };

    console.log('[Jira Webhook] Processing event:', {
      type: webhookEvent.eventType,
      issue: webhookEvent.issueKey,
      status: webhookEvent.status,
    });

    // Handle different event types
    switch (webhookEvent.eventType) {
      case 'jira:issue_updated':
        await handleIssueUpdated(webhookEvent, retryConfig);
        break;
      
      case 'jira:issue_created':
        await handleIssueCreated(webhookEvent, retryConfig);
        break;
      
      case 'comment_created':
        await handleCommentCreated(webhookEvent, retryConfig);
        break;
      
      default:
        console.log('[Jira Webhook] Unhandled event type:', webhookEvent.eventType);
    }

    return { success: true, event: webhookEvent };
  } catch (error: any) {
    console.error('[Jira Webhook] Processing error:', error);
    return { success: false, event: null };
  }
}

/**
 * Handle issue updated event
 */
async function handleIssueUpdated(
  event: WebhookEvent,
  retryConfig: WebhookRetryConfig
): Promise<void> {
  await executeWithRetry(async () => {
    console.log('[Jira Webhook] Issue updated:', event.issueKey, 'Status:', event.status);
    
    // Import database functions
    const { updateAgentApprovalStatus } = await import('../db');
    
    // Map Jira status to agent status
    const agentStatus = mapJiraStatusToAgentStatus(event.status);
    
    if (agentStatus) {
      await updateAgentApprovalStatus(event.issueKey, agentStatus);
      
      // If approved, trigger production deployment
      if (agentStatus === 'approved') {
        await triggerProductionDeployment(event.issueKey);
      }
    }
  }, retryConfig);
}

/**
 * Handle issue created event
 */
async function handleIssueCreated(
  event: WebhookEvent,
  retryConfig: WebhookRetryConfig
): Promise<void> {
  await executeWithRetry(async () => {
    console.log('[Jira Webhook] Issue created:', event.issueKey);
    
    // Log issue creation
    const { logWebhookEvent } = await import('../db');
    await logWebhookEvent(event);
  }, retryConfig);
}

/**
 * Handle comment created event
 */
async function handleCommentCreated(
  event: WebhookEvent,
  retryConfig: WebhookRetryConfig
): Promise<void> {
  await executeWithRetry(async () => {
    console.log('[Jira Webhook] Comment added to:', event.issueKey);
    
    // Log comment event
    const { logWebhookEvent } = await import('../db');
    await logWebhookEvent(event);
  }, retryConfig);
}

/**
 * Map Jira status to agent status
 */
function mapJiraStatusToAgentStatus(jiraStatus: string): string | null {
  const statusMap: Record<string, string> = {
    'To Do': 'pending',
    'In Progress': 'pending',
    'In Review': 'pending',
    'Approved': 'approved',
    'Done': 'approved',
    'Rejected': 'rejected',
    'Closed': 'rejected',
  };
  
  return statusMap[jiraStatus] || null;
}

/**
 * Trigger production deployment for approved agent
 */
async function triggerProductionDeployment(issueKey: string): Promise<void> {
  try {
    console.log('[Jira Webhook] Triggering production deployment for:', issueKey);
    
    const { getAgentByJiraIssue, updateAgentConfig } = await import('../db');
    
    // Get agent config
    const agent = await getAgentByJiraIssue(issueKey);
    
    if (!agent) {
      console.warn('[Jira Webhook] Agent not found for issue:', issueKey);
      return;
    }
    
    // Update agent status to production
    await updateAgentConfig(agent.id, {
      agentStatus: 'production' as any,
    });
    
    console.log('[Jira Webhook] Agent deployed to production:', agent.id);
    
    // TODO: Trigger actual deployment process (e.g., to AWS ECS)
    // This would involve:
    // 1. Building container image
    // 2. Pushing to ECR
    // 3. Updating ECS service
    // 4. Running health checks
  } catch (error) {
    console.error('[Jira Webhook] Deployment trigger failed:', error);
    throw error;
  }
}

/**
 * Execute function with exponential backoff retry
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: WebhookRetryConfig
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.retryDelayMs;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt < config.maxRetries) {
        console.warn(`[Jira Webhook] Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await sleep(delay);
        delay *= config.backoffMultiplier;
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
