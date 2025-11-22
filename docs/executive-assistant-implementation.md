# Executive Assistant - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the Executive Assistant agent with Microsoft 365 integration, knowledge graph, and intelligent email management.

## Phase 1: Microsoft 365 Setup

### 1.1 Azure AD App Registration

1. Navigate to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Configure:
   - Name: "Executive Assistant Agent"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `https://your-domain.com/auth/callback`
4. Note the **Application (client) ID** and **Directory (tenant) ID**

### 1.2 Configure API Permissions

Add the following Microsoft Graph delegated permissions:

**Mail**:
- Mail.Read
- Mail.ReadWrite
- Mail.Send

**Calendar**:
- Calendars.Read
- Calendars.ReadWrite

**Files**:
- Files.Read.All
- Sites.Read.All

**People & Organizational Data**:
- User.Read.All
- People.Read

**Teams**:
- Chat.Read
- ChannelMessage.Read

**Tasks**:
- Tasks.Read
- Tasks.ReadWrite

After adding permissions, click "Grant admin consent" to approve for the organization.

### 1.3 Create Client Secret

1. Navigate to "Certificates & secrets"
2. Click "New client secret"
3. Add description: "Executive Assistant Secret"
4. Set expiration: 24 months
5. **Copy the secret value immediately** (it won't be shown again)

### 1.4 Configure Authentication

1. Navigate to "Authentication"
2. Add platform: "Web"
3. Redirect URIs:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
4. Enable "ID tokens" and "Access tokens"
5. Save changes

## Phase 2: Environment Configuration

### 2.1 Set Environment Variables

Create `.env` file with:

```bash
# Microsoft 365 Configuration
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
MICROSOFT_REDIRECT_URI=https://your-domain.com/auth/callback

# Knowledge Graph Database
KNOWLEDGE_GRAPH_DB_URL=postgresql://user:password@host:5432/knowledge_graph

# Vector Database for Semantic Search
VECTOR_DB_URL=http://localhost:6333  # Qdrant
VECTOR_DB_API_KEY=your_qdrant_api_key

# LLM Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o

# Application Settings
APP_URL=https://your-domain.com
SESSION_SECRET=your_session_secret
```

### 2.2 Install Dependencies

```bash
npm install @microsoft/microsoft-graph-client @azure/msal-node
npm install pg pgvector  # PostgreSQL with vector support
npm install @qdrant/js-client  # Vector database client
npm install openai  # LLM integration
```

## Phase 3: Knowledge Graph Implementation

### 3.1 Database Schema

Create PostgreSQL database with pgvector extension:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Entities table
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,  -- person, project, topic, document, decision
    name VARCHAR(255) NOT NULL,
    attributes JSONB,
    embedding vector(1536),  -- OpenAI embedding dimension
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Relationships table
CREATE TABLE relationships (
    id SERIAL PRIMARY KEY,
    from_entity_id INTEGER REFERENCES entities(id),
    to_entity_id INTEGER REFERENCES entities(id),
    relationship_type VARCHAR(50) NOT NULL,  -- works_on, reports_to, relates_to, etc.
    strength FLOAT DEFAULT 1.0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents index table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) UNIQUE NOT NULL,  -- Microsoft Graph ID
    title VARCHAR(500),
    content TEXT,
    document_type VARCHAR(50),  -- email, word, excel, pdf, etc.
    source VARCHAR(100),  -- outlook, onedrive, sharepoint, teams
    source_url TEXT,
    embedding vector(1536),
    metadata JSONB,
    indexed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_embedding ON entities USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
```

### 3.2 Knowledge Extraction Pipeline

```typescript
// server/knowledgeGraph/extractor.ts

import { Client } from "@microsoft/microsoft-graph-client";
import { OpenAI } from "openai";
import { Pool } from "pg";

export class KnowledgeExtractor {
  private graphClient: Client;
  private openai: OpenAI;
  private db: Pool;

  constructor(graphClient: Client, openai: OpenAI, db: Pool) {
    this.graphClient = graphClient;
    this.openai = openai;
    this.db = db;
  }

  /**
   * Extract knowledge from a new email
   */
  async processEmail(emailId: string): Promise<void> {
    // Fetch email from Microsoft Graph
    const email = await this.graphClient
      .api(`/me/messages/${emailId}`)
      .select('subject,body,from,toRecipients,receivedDateTime')
      .get();

    // Extract entities using LLM
    const entities = await this.extractEntities(email);

    // Generate embedding for email content
    const embedding = await this.generateEmbedding(
      `${email.subject} ${email.body.content}`
    );

    // Store document
    await this.storeDocument({
      document_id: emailId,
      title: email.subject,
      content: email.body.content,
      document_type: 'email',
      source: 'outlook',
      source_url: email.webLink,
      embedding,
      metadata: {
        from: email.from.emailAddress,
        to: email.toRecipients,
        receivedDateTime: email.receivedDateTime
      }
    });

    // Update knowledge graph
    for (const entity of entities) {
      await this.upsertEntity(entity);
      await this.createRelationship(entity, emailId);
    }
  }

  /**
   * Extract entities from text using LLM
   */
  private async extractEntities(email: any): Promise<any[]> {
    const prompt = `Extract entities from this email:
Subject: ${email.subject}
Body: ${email.body.content}

Extract:
1. People mentioned (name, role if mentioned)
2. Projects discussed (name, status if mentioned)
3. Topics/keywords
4. Decisions made
5. Action items with deadlines

Return as JSON array with format:
[
  {
    "type": "person|project|topic|decision|action",
    "name": "entity name",
    "attributes": {...}
  }
]`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content).entities;
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    return response.data[0].embedding;
  }

  /**
   * Store document in database
   */
  private async storeDocument(doc: any): Promise<void> {
    await this.db.query(`
      INSERT INTO documents (document_id, title, content, document_type, source, source_url, embedding, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (document_id) DO UPDATE
      SET title = $2, content = $3, embedding = $7, metadata = $8, indexed_at = NOW()
    `, [
      doc.document_id,
      doc.title,
      doc.content,
      doc.document_type,
      doc.source,
      doc.source_url,
      `[${doc.embedding.join(',')}]`,
      JSON.stringify(doc.metadata)
    ]);
  }

  /**
   * Upsert entity in knowledge graph
   */
  private async upsertEntity(entity: any): Promise<number> {
    const embedding = await this.generateEmbedding(
      `${entity.name} ${JSON.stringify(entity.attributes)}`
    );

    const result = await this.db.query(`
      INSERT INTO entities (entity_type, name, attributes, embedding)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (entity_type, name) DO UPDATE
      SET attributes = $3, embedding = $4, updated_at = NOW()
      RETURNING id
    `, [
      entity.type,
      entity.name,
      JSON.stringify(entity.attributes),
      `[${embedding.join(',')}]`
    ]);

    return result.rows[0].id;
  }

  /**
   * Create relationship between entity and document
   */
  private async createRelationship(entity: any, documentId: string): Promise<void> {
    // Get document entity ID
    const docResult = await this.db.query(
      'SELECT id FROM entities WHERE entity_type = $1 AND name = $2',
      ['document', documentId]
    );

    if (docResult.rows.length === 0) return;

    await this.db.query(`
      INSERT INTO relationships (from_entity_id, to_entity_id, relationship_type)
      VALUES ($1, $2, 'mentioned_in')
      ON CONFLICT DO NOTHING
    `, [entity.id, docResult.rows[0].id]);
  }
}
```

### 3.3 Scheduled Knowledge Extraction

```typescript
// server/jobs/knowledgeSync.ts

import cron from 'node-cron';
import { KnowledgeExtractor } from '../knowledgeGraph/extractor';

/**
 * Schedule knowledge extraction jobs
 */
export function scheduleKnowledgeSync(extractor: KnowledgeExtractor) {
  // Process new emails every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Knowledge Sync] Processing new emails...');
    await extractor.processNewEmails();
  });

  // Index OneDrive/SharePoint documents daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Knowledge Sync] Indexing documents...');
    await extractor.indexDocuments();
  });

  // Process Teams chats hourly
  cron.schedule('0 * * * *', async () => {
    console.log('[Knowledge Sync] Processing Teams chats...');
    await extractor.processTeamsChats();
  });

  // Prune old relationships weekly
  cron.schedule('0 3 * * 0', async () => {
    console.log('[Knowledge Sync] Pruning old relationships...');
    await extractor.pruneOldRelationships();
  });
}
```

## Phase 4: Email Intelligence Implementation

### 4.1 Priority Scoring Algorithm

```typescript
// server/emailIntelligence/priorityScorer.ts

export interface EmailPriorityScore {
  score: number;  // 1-10
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  reasoning: string;
  suggestedAction: string;
  relatedProjects: string[];
}

export class EmailPriorityScorer {
  /**
   * Calculate email priority score
   */
  async scoreEmail(email: any, context: any): Promise<EmailPriorityScore> {
    let score = 5;  // Base score
    const factors: string[] = [];

    // Factor 1: Sender importance (0-3 points)
    const senderScore = await this.getSenderImportance(email.from);
    score += senderScore;
    if (senderScore > 2) {
      factors.push(`High-priority sender (${email.from.name})`);
    }

    // Factor 2: Urgency keywords (0-2 points)
    const urgencyScore = this.detectUrgencyKeywords(email.subject, email.body);
    score += urgencyScore;
    if (urgencyScore > 0) {
      factors.push('Contains urgency keywords');
    }

    // Factor 3: Deadline proximity (0-2 points)
    const deadlineScore = this.detectDeadlines(email.body);
    score += deadlineScore;
    if (deadlineScore > 0) {
      factors.push('Contains upcoming deadline');
    }

    // Factor 4: Project relevance (0-2 points)
    const projectScore = await this.getProjectRelevance(email, context);
    score += projectScore.score;
    if (projectScore.projects.length > 0) {
      factors.push(`Related to active projects: ${projectScore.projects.join(', ')}`);
    }

    // Factor 5: Direct mention (0-1 point)
    if (this.isDirectlyAddressed(email)) {
      score += 1;
      factors.push('Directly addressed to you');
    }

    // Normalize score to 1-10
    score = Math.min(10, Math.max(1, score));

    // Determine urgency level
    let urgency: EmailPriorityScore['urgency'];
    if (score >= 9) urgency = 'urgent';
    else if (score >= 7) urgency = 'high';
    else if (score >= 4) urgency = 'medium';
    else urgency = 'low';

    // Suggest action
    let suggestedAction: string;
    if (score >= 9) suggestedAction = 'respond_immediately';
    else if (score >= 7) suggestedAction = 'respond_today';
    else if (score >= 4) suggestedAction = 'respond_this_week';
    else suggestedAction = 'review_when_available';

    return {
      score,
      urgency,
      reasoning: factors.join('; '),
      suggestedAction,
      relatedProjects: projectScore.projects
    };
  }

  private async getSenderImportance(from: any): Promise<number> {
    // Check if sender is in VIP list
    const vipSenders = ['ceo@company.com', 'cfo@company.com', 'board@company.com'];
    if (vipSenders.includes(from.emailAddress.address)) {
      return 3;
    }

    // Check organizational hierarchy
    // (Query Microsoft Graph for manager/direct report relationships)
    const isManager = await this.isUserManager(from.emailAddress.address);
    if (isManager) return 2;

    // Check interaction frequency
    const interactionCount = await this.getInteractionCount(from.emailAddress.address);
    if (interactionCount > 50) return 1;

    return 0;
  }

  private detectUrgencyKeywords(subject: string, body: string): number {
    const text = `${subject} ${body}`.toLowerCase();
    
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const highPriorityKeywords = ['important', 'priority', 'deadline', 'time-sensitive'];

    if (urgentKeywords.some(kw => text.includes(kw))) return 2;
    if (highPriorityKeywords.some(kw => text.includes(kw))) return 1;
    
    return 0;
  }

  private detectDeadlines(body: string): number {
    // Simple deadline detection (can be enhanced with NLP)
    const deadlinePatterns = [
      /by (today|tomorrow|this week|end of week)/i,
      /due (today|tomorrow|this week)/i,
      /deadline.*?(today|tomorrow|this week)/i
    ];

    for (const pattern of deadlinePatterns) {
      if (pattern.test(body)) {
        return 2;
      }
    }

    return 0;
  }

  private async getProjectRelevance(email: any, context: any): Promise<{ score: number; projects: string[] }> {
    // Query knowledge graph for project mentions
    const projects = await this.findRelatedProjects(email.subject, email.body);
    
    if (projects.length === 0) return { score: 0, projects: [] };
    
    // Check if projects are high-priority
    const highPriorityProjects = projects.filter(p => p.priority === 'high');
    
    if (highPriorityProjects.length > 0) {
      return { score: 2, projects: highPriorityProjects.map(p => p.name) };
    }
    
    return { score: 1, projects: projects.map(p => p.name) };
  }

  private isDirectlyAddressed(email: any): boolean {
    // Check if user is in "To" field (not just CC)
    return email.toRecipients.some((r: any) => 
      r.emailAddress.address === email.currentUserEmail
    );
  }
}
```

### 4.2 Context-Aware Response Drafting

```typescript
// server/emailIntelligence/responseDrafter.ts

export class ResponseDrafter {
  /**
   * Draft email response based on context
   */
  async draftResponse(
    email: any,
    responseType: 'acknowledge' | 'detailed_response' | 'decline' | 'delegate',
    keyPoints: string[] = []
  ): Promise<{ draftBody: string; confidence: number; contextUsed: string[] }> {
    
    // Gather context
    const context = await this.gatherContext(email);
    
    // Get user's communication style
    const style = await this.getUserCommunicationStyle();
    
    // Build prompt for LLM
    const prompt = this.buildResponsePrompt(email, responseType, keyPoints, context, style);
    
    // Generate response
    const response = await this.generateResponse(prompt);
    
    return {
      draftBody: response.text,
      confidence: response.confidence,
      contextUsed: context.sources
    };
  }

  private async gatherContext(email: any): Promise<any> {
    const context = {
      previousEmails: [],
      relatedProjects: [],
      recentDecisions: [],
      relevantDocuments: [],
      sources: []
    };

    // 1. Find previous email thread
    const thread = await this.findEmailThread(email.conversationId);
    if (thread.length > 0) {
      context.previousEmails = thread;
      context.sources.push('previous_email_thread');
    }

    // 2. Query knowledge graph for related projects
    const projects = await this.findRelatedProjects(email.subject, email.body);
    if (projects.length > 0) {
      context.relatedProjects = projects;
      context.sources.push('project_context');
    }

    // 3. Find recent decisions on similar topics
    const decisions = await this.findRecentDecisions(email.subject);
    if (decisions.length > 0) {
      context.recentDecisions = decisions;
      context.sources.push('recent_decisions');
    }

    // 4. Search relevant documents
    const docs = await this.searchRelevantDocuments(email.subject, email.body);
    if (docs.length > 0) {
      context.relevantDocuments = docs;
      context.sources.push('relevant_documents');
    }

    return context;
  }

  private async getUserCommunicationStyle(): Promise<any> {
    // Analyze user's sent emails to learn communication style
    // (This would be cached and updated periodically)
    
    return {
      tone: 'professional',
      averageLength: 'medium',  // short, medium, long
      signatureStyle: 'formal',
      commonPhrases: ['Thank you for', 'I appreciate', 'Let me know if'],
      greetingStyle: 'Hi [Name],'
    };
  }

  private buildResponsePrompt(
    email: any,
    responseType: string,
    keyPoints: string[],
    context: any,
    style: any
  ): string {
    return `You are drafting an email response on behalf of an executive.

Original Email:
From: ${email.from.emailAddress.name} <${email.from.emailAddress.address}>
Subject: ${email.subject}
Body: ${email.body.content}

Response Type: ${responseType}

Context:
${context.previousEmails.length > 0 ? `Previous conversation: ${JSON.stringify(context.previousEmails)}` : ''}
${context.relatedProjects.length > 0 ? `Related projects: ${context.relatedProjects.map((p: any) => p.name).join(', ')}` : ''}
${context.recentDecisions.length > 0 ? `Recent decisions: ${JSON.stringify(context.recentDecisions)}` : ''}

Key Points to Address:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Communication Style:
- Tone: ${style.tone}
- Length: ${style.averageLength}
- Greeting: ${style.greetingStyle}

Draft a ${responseType} response that:
1. Addresses all key points
2. Incorporates relevant context
3. Matches the communication style
4. Is clear, concise, and actionable

Response:`;
  }

  private async generateResponse(prompt: string): Promise<{ text: string; confidence: number }> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return {
      text: response.choices[0].message.content,
      confidence: 0.85  // Can be calculated based on context availability
    };
  }
}
```

## Phase 5: Testing & Deployment

### 5.1 Unit Tests

```typescript
// server/__tests__/knowledgeGraph.test.ts

import { KnowledgeExtractor } from '../knowledgeGraph/extractor';

describe('Knowledge Extractor', () => {
  it('should extract entities from email', async () => {
    const email = {
      subject: 'Q4 Budget Review Meeting',
      body: {
        content: 'We need to review the Q4 budget with John and Sarah by Friday.'
      }
    };

    const entities = await extractor.extractEntities(email);

    expect(entities).toContainEqual({
      type: 'project',
      name: 'Q4 Budget Review'
    });
    expect(entities).toContainEqual({
      type: 'person',
      name: 'John'
    });
  });
});
```

### 5.2 Integration Tests

```typescript
// server/__tests__/emailIntelligence.test.ts

import { EmailPriorityScorer } from '../emailIntelligence/priorityScorer';

describe('Email Priority Scorer', () => {
  it('should score CEO email as urgent', async () => {
    const email = {
      from: { emailAddress: { address: 'ceo@company.com' } },
      subject: 'Urgent: Board Meeting Tomorrow',
      body: { content: 'Need your input ASAP' }
    };

    const score = await scorer.scoreEmail(email, {});

    expect(score.urgency).toBe('urgent');
    expect(score.score).toBeGreaterThanOrEqual(9);
  });
});
```

### 5.3 Deployment Checklist

- [ ] Microsoft 365 app registered and configured
- [ ] All API permissions granted and consented
- [ ] Environment variables set in production
- [ ] PostgreSQL database with pgvector extension deployed
- [ ] Vector database (Qdrant) deployed and configured
- [ ] Knowledge extraction cron jobs scheduled
- [ ] Email webhook configured for real-time processing
- [ ] Monitoring and logging enabled
- [ ] User onboarding documentation prepared
- [ ] Initial knowledge base seeding completed

## Phase 6: User Onboarding

### 6.1 Initial Setup

1. **Grant OAuth Consent**: User clicks "Connect Microsoft 365" and grants permissions
2. **Configure Priority Rules**: Set VIP senders, urgent keywords, project priorities
3. **Set Approval Workflows**: Define which actions require confirmation
4. **Initial Knowledge Base Seeding**: Run full index of past 90 days of emails and documents
5. **Communication Style Learning**: Analyze past sent emails to learn style

### 6.2 User Training

- **Email Management**: How to review priority scores and approve draft responses
- **Calendar Management**: How to review meeting suggestions and resolve conflicts
- **Knowledge Base**: How to search and query the personal knowledge graph
- **Task Coordination**: How to view project summaries and team status
- **Configuration**: How to adjust settings and preferences

## Maintenance & Monitoring

### Automated Monitoring

- Knowledge extraction job success rate
- Email processing latency
- Response draft acceptance rate
- Knowledge graph size and growth
- API rate limit usage

### User Feedback Loop

- Track which draft responses are accepted/edited
- Monitor priority score accuracy
- Collect feedback on meeting suggestions
- Refine knowledge extraction based on corrections

## Security Considerations

- All Microsoft 365 tokens stored encrypted
- Knowledge base access restricted to user only
- Audit log of all agent actions
- Regular security reviews of API permissions
- Data retention policies enforced
- GDPR compliance for personal data

## Future Enhancements

1. **Voice Interface**: Verbal commands for common tasks
2. **Mobile App**: On-the-go access to assistant
3. **Slack Integration**: Extend beyond Microsoft ecosystem
4. **Predictive Analytics**: Anticipate needs before asked
5. **Team Insights**: Aggregate patterns across direct reports
6. **Auto-delegation**: Suggest task redistribution for workload balance
