import crypto from 'crypto';

/**
 * Jira Webhook HMAC Verification
 * 
 * Verifies that webhook requests are genuinely from Jira by validating
 * the HMAC signature in the X-Hub-Signature header.
 */

export interface JiraWebhookConfig {
  secret: string;
  algorithm?: 'sha256' | 'sha1';
}

/**
 * Verify HMAC signature from Jira webhook
 * @param payload - Raw request body as string
 * @param signature - Signature from X-Hub-Signature header
 * @param secret - Shared secret configured in Jira
 * @param algorithm - Hash algorithm (default: sha256)
 * @returns true if signature is valid
 */
export function verifyJiraWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  if (!signature || !payload || !secret) {
    return false;
  }

  try {
    // Jira sends signature as "sha256=<hash>" or "sha1=<hash>"
    const parts = signature.split('=');
    if (parts.length !== 2) {
      return false;
    }

    const [alg, receivedHash] = parts;
    if (alg !== algorithm) {
      return false;
    }

    // Compute HMAC
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload, 'utf8');
    const computedHash = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(receivedHash, 'hex'),
        Buffer.from(computedHash, 'hex')
      );
    } catch (error) {
      // Buffers have different lengths, signature is invalid
      return false;
    }
  } catch (error) {
    console.error('[Jira Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Express middleware for Jira webhook verification
 */
export function createJiraWebhookMiddleware(config: JiraWebhookConfig) {
  return (req: any, res: any, next: any) => {
    const signature = req.headers['x-hub-signature'] || req.headers['x-hub-signature-256'];
    
    if (!signature) {
      console.warn('[Jira Webhook] Missing signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Get raw body (must be preserved for signature verification)
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    const isValid = verifyJiraWebhookSignature(
      rawBody,
      signature as string,
      config.secret,
      config.algorithm
    );

    if (!isValid) {
      console.warn('[Jira Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  };
}

/**
 * Parse Jira webhook event type
 */
export function parseJiraWebhookEvent(body: any): {
  eventType: string;
  issueKey?: string;
  issueId?: string;
  status?: string;
  assignee?: string;
  comment?: string;
} {
  const eventType = body.webhookEvent || body.issue_event_type_name || 'unknown';
  
  return {
    eventType,
    issueKey: body.issue?.key,
    issueId: body.issue?.id,
    status: body.issue?.fields?.status?.name,
    assignee: body.issue?.fields?.assignee?.emailAddress,
    comment: body.comment?.body,
  };
}
