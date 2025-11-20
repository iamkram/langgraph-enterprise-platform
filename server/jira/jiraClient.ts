import axios, { AxiosInstance } from 'axios';

/**
 * Jira API Client
 * 
 * Handles communication with Jira REST API for issue creation,
 * updates, and attachment uploads.
 */

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIssue {
  key: string;
  id: string;
  self: string;
}

export interface CreateIssueRequest {
  summary: string;
  description: string;
  issueType: string;
  priority?: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  labels?: string[];
  assignee?: string;
  customFields?: Record<string, any>;
}

export interface AddAttachmentRequest {
  issueKey: string;
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    
    // Create authenticated axios instance
    this.client = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      auth: {
        username: config.email,
        password: config.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new Jira issue
   */
  async createIssue(request: CreateIssueRequest): Promise<JiraIssue> {
    try {
      const payload = {
        fields: {
          project: {
            key: this.config.projectKey,
          },
          summary: request.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: request.description,
                  },
                ],
              },
            ],
          },
          issuetype: {
            name: request.issueType,
          },
          ...(request.priority && {
            priority: {
              name: request.priority,
            },
          }),
          ...(request.labels && {
            labels: request.labels,
          }),
          ...(request.assignee && {
            assignee: {
              emailAddress: request.assignee,
            },
          }),
          ...request.customFields,
        },
      };

      const response = await this.client.post('/issue', payload);
      
      return {
        key: response.data.key,
        id: response.data.id,
        self: response.data.self,
      };
    } catch (error: any) {
      console.error('[Jira] Failed to create issue:', error.response?.data || error.message);
      throw new Error(`Failed to create Jira issue: ${error.message}`);
    }
  }

  /**
   * Add attachment to existing issue
   */
  async addAttachment(request: AddAttachmentRequest): Promise<void> {
    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('file', request.content, {
        filename: request.filename,
        contentType: request.contentType || 'application/octet-stream',
      });

      await this.client.post(
        `/issue/${request.issueKey}/attachments`,
        formData,
        {
          headers: {
            'X-Atlassian-Token': 'no-check',
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error: any) {
      console.error('[Jira] Failed to add attachment:', error.response?.data || error.message);
      throw new Error(`Failed to add attachment: ${error.message}`);
    }
  }

  /**
   * Update issue status (transition)
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: {
          id: transitionId,
        },
      });
    } catch (error: any) {
      console.error('[Jira] Failed to transition issue:', error.response?.data || error.message);
      throw new Error(`Failed to transition issue: ${error.message}`);
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      });
    } catch (error: any) {
      console.error('[Jira] Failed to add comment:', error.response?.data || error.message);
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error: any) {
      console.error('[Jira] Failed to get issue:', error.response?.data || error.message);
      throw new Error(`Failed to get issue: ${error.message}`);
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/issue/${issueKey}/transitions`);
      return response.data.transitions;
    } catch (error: any) {
      console.error('[Jira] Failed to get transitions:', error.response?.data || error.message);
      throw new Error(`Failed to get transitions: ${error.message}`);
    }
  }
}

/**
 * Create Jira client instance from environment variables
 */
export function createJiraClient(): JiraClient | null {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    console.warn('[Jira] Missing configuration, Jira integration disabled');
    return null;
  }

  return new JiraClient({
    baseUrl,
    email,
    apiToken,
    projectKey,
  });
}
