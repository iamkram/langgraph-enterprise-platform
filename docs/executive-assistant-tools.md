# Executive Assistant - Tool Specifications

## Email Management Tools

### 1. analyze_email_priority
**Description**: Analyzes an email to determine its priority score and urgency level

**Parameters**:
- `email_id` (string, required): The unique identifier of the email
- `sender_email` (string, required): Email address of the sender
- `subject` (string, required): Email subject line
- `body_preview` (string, required): First 200 characters of email body
- `received_time` (string, required): ISO 8601 timestamp

**Returns**:
```json
{
  "priority_score": 8,
  "urgency_level": "high",
  "reasoning": "Email from CEO regarding quarterly review deadline tomorrow",
  "suggested_action": "respond_today",
  "related_projects": ["Q4-Review", "Board-Presentation"]
}
```

**Microsoft Graph API**: `GET /me/messages/{id}`

---

### 2. draft_email_response
**Description**: Generates a context-aware email response based on conversation history and knowledge base

**Parameters**:
- `email_id` (string, required): ID of email to respond to
- `response_type` (string, required): "acknowledge", "detailed_response", "decline", "delegate"
- `key_points` (array, optional): Specific points to address in response
- `tone` (string, optional): "formal", "casual", "direct" (default: learned from user's style)

**Returns**:
```json
{
  "draft_body": "Hi John,\n\nThank you for raising this...",
  "confidence_score": 0.85,
  "context_used": ["previous_email_thread", "project_status", "user_style"],
  "suggested_edits": ["Consider mentioning the deadline", "Add CC to Sarah"]
}
```

**Microsoft Graph API**: `GET /me/messages/{id}`, Knowledge Base Query

---

### 3. extract_action_items
**Description**: Identifies tasks, deadlines, and follow-ups from email content

**Parameters**:
- `email_id` (string, required): Email to analyze
- `email_body` (string, required): Full email content

**Returns**:
```json
{
  "action_items": [
    {
      "task": "Review Q4 budget proposal",
      "deadline": "2025-11-25T17:00:00Z",
      "assigned_to": "user",
      "priority": "high",
      "related_project": "Q4-Budget"
    },
    {
      "task": "Schedule meeting with finance team",
      "deadline": "2025-11-22T12:00:00Z",
      "assigned_to": "user",
      "priority": "medium"
    }
  ],
  "follow_ups": [
    {
      "with": "john@company.com",
      "regarding": "Budget approval status",
      "by_date": "2025-11-26"
    }
  ]
}
```

---

### 4. search_similar_emails
**Description**: Finds previous emails related to current topic or sender

**Parameters**:
- `sender_email` (string, optional): Find emails from specific sender
- `topic_keywords` (array, required): Keywords to search for
- `date_range_days` (integer, optional): Search last N days (default: 90)
- `limit` (integer, optional): Max results (default: 10)

**Returns**:
```json
{
  "similar_emails": [
    {
      "email_id": "AAMkAGI...",
      "subject": "Re: Q3 Budget Review",
      "sent_date": "2025-10-15T14:30:00Z",
      "relevance_score": 0.92,
      "key_excerpt": "We agreed to increase the marketing budget by 15%..."
    }
  ]
}
```

**Microsoft Graph API**: `GET /me/messages?$search="{keywords}"`

---

### 5. categorize_email
**Description**: Assigns project tags and categories to an email

**Parameters**:
- `email_id` (string, required): Email to categorize
- `subject` (string, required): Email subject
- `body` (string, required): Email content
- `sender` (string, required): Sender email

**Returns**:
```json
{
  "categories": ["Q4-Budget", "Finance", "High-Priority"],
  "project_tags": ["Q4-Review", "Board-Presentation"],
  "confidence": 0.88,
  "suggested_folder": "Projects/Q4"
}
```

**Microsoft Graph API**: `PATCH /me/messages/{id}` (update categories)

---

## Calendar Management Tools

### 6. find_available_slots
**Description**: Searches calendar for available meeting times

**Parameters**:
- `duration_minutes` (integer, required): Meeting length
- `attendees` (array, required): List of attendee email addresses
- `preferred_days` (array, optional): Days of week (0=Sunday, 6=Saturday)
- `preferred_hours` (object, optional): `{"start": 9, "end": 17}`
- `date_range` (object, required): `{"start": "2025-11-22", "end": "2025-11-29"}`

**Returns**:
```json
{
  "available_slots": [
    {
      "start_time": "2025-11-23T14:00:00Z",
      "end_time": "2025-11-23T15:00:00Z",
      "attendee_availability": {
        "all_available": true,
        "tentative": []
      },
      "score": 0.95,
      "reasoning": "All attendees free, within preferred hours, no conflicts"
    }
  ]
}
```

**Microsoft Graph API**: `POST /me/calendar/getSchedule`

---

### 7. schedule_meeting
**Description**: Creates a calendar event with specified attendees

**Parameters**:
- `subject` (string, required): Meeting title
- `start_time` (string, required): ISO 8601 datetime
- `end_time` (string, required): ISO 8601 datetime
- `attendees` (array, required): Email addresses
- `location` (string, optional): Physical or Teams meeting
- `body` (string, optional): Meeting description
- `is_online` (boolean, optional): Create Teams meeting (default: true)

**Returns**:
```json
{
  "event_id": "AAMkAGI...",
  "web_link": "https://outlook.office.com/...",
  "teams_link": "https://teams.microsoft.com/...",
  "status": "scheduled",
  "invites_sent": true
}
```

**Microsoft Graph API**: `POST /me/events`

---

### 8. suggest_reschedule
**Description**: Proposes alternative meeting times when conflicts arise

**Parameters**:
- `event_id` (string, required): Conflicting event ID
- `reason` (string, required): Reason for rescheduling
- `duration_minutes` (integer, required): Meeting length

**Returns**:
```json
{
  "alternative_times": [
    {
      "start_time": "2025-11-24T10:00:00Z",
      "end_time": "2025-11-24T11:00:00Z",
      "all_attendees_available": true,
      "score": 0.90
    }
  ],
  "suggested_message": "Due to a conflict, could we move our meeting to..."
}
```

---

### 9. get_meeting_context
**Description**: Retrieves relevant information for an upcoming meeting

**Parameters**:
- `event_id` (string, required): Meeting event ID
- `include_attendee_profiles` (boolean, optional): default true
- `include_related_docs` (boolean, optional): default true

**Returns**:
```json
{
  "meeting_details": {
    "subject": "Q4 Budget Review",
    "start_time": "2025-11-23T14:00:00Z",
    "attendees": ["john@company.com", "sarah@company.com"]
  },
  "context": {
    "previous_meetings": [
      {
        "date": "2025-10-15",
        "subject": "Q3 Budget Review",
        "key_decisions": ["Approved 15% increase in marketing"]
      }
    ],
    "related_documents": [
      {
        "title": "Q4 Budget Proposal.xlsx",
        "location": "SharePoint/Finance/Q4",
        "last_modified": "2025-11-20"
      }
    ],
    "open_action_items": [
      "Review final budget numbers",
      "Get approval from CFO"
    ]
  },
  "attendee_profiles": [
    {
      "name": "John Smith",
      "title": "CFO",
      "recent_interactions": 5,
      "key_topics": ["budget", "finance", "quarterly-review"]
    }
  ]
}
```

**Microsoft Graph API**: `GET /me/events/{id}`, `GET /users/{id}`, Knowledge Base

---

## Knowledge Management Tools

### 10. search_knowledge_base
**Description**: Full-text search across emails, documents, and knowledge graph

**Parameters**:
- `query` (string, required): Search query
- `sources` (array, optional): ["email", "onedrive", "sharepoint", "teams"] (default: all)
- `date_range` (object, optional): `{"start": "2025-01-01", "end": "2025-11-21"}`
- `limit` (integer, optional): Max results (default: 20)

**Returns**:
```json
{
  "results": [
    {
      "type": "email",
      "title": "Re: Q4 Budget Discussion",
      "snippet": "...we agreed to allocate $500K for the new initiative...",
      "date": "2025-11-15T10:30:00Z",
      "relevance_score": 0.94,
      "source_link": "https://outlook.office.com/..."
    },
    {
      "type": "document",
      "title": "Q4 Budget Proposal.xlsx",
      "snippet": "Total budget: $2.5M, Marketing: $750K...",
      "location": "SharePoint/Finance/Q4",
      "relevance_score": 0.89,
      "source_link": "https://company.sharepoint.com/..."
    }
  ],
  "total_count": 15
}
```

**Microsoft Graph API**: `GET /me/messages?$search`, `GET /me/drive/root/search`, `GET /sites/{site-id}/drive/root/search`

---

### 11. query_knowledge_graph
**Description**: Graph traversal queries to find relationships and connections

**Parameters**:
- `entity_type` (string, required): "person", "project", "topic", "document"
- `entity_id` (string, required): Entity identifier
- `relationship_types` (array, optional): ["works_on", "reports_to", "relates_to"]
- `depth` (integer, optional): Traversal depth (default: 2)

**Returns**:
```json
{
  "entity": {
    "id": "project_q4_budget",
    "type": "project",
    "name": "Q4 Budget Review",
    "attributes": {
      "status": "in_progress",
      "priority": "high",
      "deadline": "2025-11-30"
    }
  },
  "relationships": [
    {
      "type": "owned_by",
      "target": {
        "id": "user_john_smith",
        "name": "John Smith",
        "role": "CFO"
      }
    },
    {
      "type": "depends_on",
      "target": {
        "id": "project_q3_review",
        "name": "Q3 Review Completion"
      }
    },
    {
      "type": "related_documents",
      "targets": [
        {
          "id": "doc_budget_proposal",
          "title": "Q4 Budget Proposal.xlsx",
          "location": "SharePoint/Finance"
        }
      ]
    }
  ]
}
```

**Microsoft Graph API**: `GET /me/insights/trending`, `GET /me/insights/used`, Custom Knowledge Graph

---

### 12. extract_document_knowledge
**Description**: Processes a document to extract entities and relationships

**Parameters**:
- `document_url` (string, required): OneDrive or SharePoint URL
- `document_type` (string, required): "word", "excel", "powerpoint", "pdf"
- `extract_types` (array, optional): ["entities", "topics", "dates", "decisions"]

**Returns**:
```json
{
  "document_id": "doc_12345",
  "extracted_entities": [
    {
      "type": "project",
      "name": "Q4 Budget Review",
      "confidence": 0.95
    },
    {
      "type": "person",
      "name": "John Smith",
      "role": "CFO",
      "confidence": 0.92
    }
  ],
  "topics": ["budget", "quarterly-review", "finance"],
  "key_dates": [
    {
      "date": "2025-11-30",
      "description": "Budget approval deadline"
    }
  ],
  "decisions": [
    "Approved 15% increase in marketing budget",
    "Deferred IT infrastructure upgrade to Q1 2026"
  ]
}
```

**Microsoft Graph API**: `GET /me/drive/items/{id}/content`, NLP Processing

---

### 13. get_project_context
**Description**: Retrieves comprehensive information about a specific project

**Parameters**:
- `project_name` (string, required): Project identifier
- `include_team` (boolean, optional): Include team members (default: true)
- `include_documents` (boolean, optional): Include related documents (default: true)
- `include_timeline` (boolean, optional): Include key dates (default: true)

**Returns**:
```json
{
  "project": {
    "name": "Q4 Budget Review",
    "status": "in_progress",
    "priority": "high",
    "owner": "John Smith",
    "deadline": "2025-11-30"
  },
  "team_members": [
    {
      "name": "Sarah Johnson",
      "role": "Finance Manager",
      "responsibilities": ["Budget analysis", "Reporting"]
    }
  ],
  "related_documents": [
    {
      "title": "Q4 Budget Proposal.xlsx",
      "location": "SharePoint/Finance/Q4",
      "last_modified": "2025-11-20"
    }
  ],
  "timeline": [
    {
      "date": "2025-11-15",
      "event": "Initial proposal submitted"
    },
    {
      "date": "2025-11-30",
      "event": "Final approval deadline"
    }
  ],
  "open_items": [
    "CFO review pending",
    "Board presentation scheduled for 12/5"
  ]
}
```

---

## Task Coordination Tools

### 14. list_open_tasks
**Description**: Retrieves all pending tasks across projects and direct reports

**Parameters**:
- `filter_by_project` (string, optional): Project name
- `filter_by_assignee` (string, optional): Team member email
- `filter_by_priority` (string, optional): "high", "medium", "low"
- `due_within_days` (integer, optional): Tasks due in next N days

**Returns**:
```json
{
  "tasks": [
    {
      "id": "task_001",
      "title": "Review Q4 budget proposal",
      "project": "Q4 Budget Review",
      "assigned_to": "user",
      "due_date": "2025-11-25",
      "priority": "high",
      "status": "in_progress",
      "blockers": []
    },
    {
      "id": "task_002",
      "title": "Approve marketing campaign",
      "project": "Holiday Campaign",
      "assigned_to": "sarah@company.com",
      "due_date": "2025-11-23",
      "priority": "medium",
      "status": "pending_review",
      "blockers": ["Waiting for design team"]
    }
  ],
  "summary": {
    "total": 45,
    "high_priority": 8,
    "overdue": 2,
    "due_this_week": 12
  }
}
```

**Microsoft Graph API**: `GET /me/todo/lists`, `GET /planner/tasks`

---

### 15. generate_project_summary
**Description**: Creates an executive summary of project status

**Parameters**:
- `project_name` (string, optional): Specific project (default: all projects)
- `include_metrics` (boolean, optional): Include KPIs (default: true)
- `include_risks` (boolean, optional): Include risk assessment (default: true)

**Returns**:
```json
{
  "summary": {
    "total_projects": 12,
    "on_track": 8,
    "at_risk": 3,
    "delayed": 1
  },
  "highlights": [
    "Q4 Budget Review on track for 11/30 deadline",
    "Holiday Campaign delayed due to design resources",
    "New Product Launch ahead of schedule"
  ],
  "attention_needed": [
    {
      "project": "Holiday Campaign",
      "issue": "Design team overloaded",
      "recommendation": "Consider external contractor",
      "impact": "Campaign launch may slip 1 week"
    }
  ],
  "upcoming_milestones": [
    {
      "project": "Q4 Budget Review",
      "milestone": "Board presentation",
      "date": "2025-12-05"
    }
  ]
}
```

---

## Meeting Assistant Tools

### 16. generate_meeting_brief
**Description**: Creates a pre-meeting context summary

**Parameters**:
- `event_id` (string, required): Meeting event ID
- `include_previous_meetings` (boolean, optional): default true
- `include_action_items` (boolean, optional): default true

**Returns**:
```json
{
  "meeting_info": {
    "subject": "Q4 Budget Review",
    "date_time": "2025-11-23T14:00:00Z",
    "duration_minutes": 60,
    "attendees": ["John Smith (CFO)", "Sarah Johnson (Finance Mgr)"]
  },
  "context": {
    "purpose": "Review and approve Q4 budget allocation",
    "previous_discussion": "Last met on 10/15, agreed to 15% marketing increase",
    "key_documents": [
      "Q4 Budget Proposal.xlsx",
      "Q3 Actuals Report.pdf"
    ]
  },
  "open_action_items": [
    "John to review final numbers",
    "Sarah to prepare variance analysis"
  ],
  "suggested_agenda": [
    "Review Q3 actuals vs budget (10 min)",
    "Discuss Q4 allocation by department (30 min)",
    "Address concerns and questions (15 min)",
    "Next steps and approval timeline (5 min)"
  ],
  "talking_points": [
    "Marketing budget increase rationale",
    "IT infrastructure deferral impact",
    "Contingency fund allocation"
  ]
}
```

---

### 17. get_attendee_profiles
**Description**: Provides background information on meeting participants

**Parameters**:
- `attendee_emails` (array, required): List of participant emails
- `include_recent_interactions` (boolean, optional): default true
- `include_org_chart` (boolean, optional): default true

**Returns**:
```json
{
  "profiles": [
    {
      "name": "John Smith",
      "title": "Chief Financial Officer",
      "department": "Finance",
      "reports_to": "CEO",
      "direct_reports": 8,
      "recent_interactions": {
        "emails": 15,
        "meetings": 3,
        "last_contact": "2025-11-20"
      },
      "key_topics": ["budget", "finance", "quarterly-review", "board-reporting"],
      "communication_style": "Direct, data-driven, prefers concise updates",
      "decision_authority": ["budget_approval", "financial_policy"]
    }
  ]
}
```

**Microsoft Graph API**: `GET /users/{id}`, `GET /users/{id}/manager`, `GET /users/{id}/directReports`

---

## Microsoft Graph Knowledge API Tools

### 18. query_microsoft_graph_insights
**Description**: Leverages Microsoft's organizational knowledge graph

**Parameters**:
- `insight_type` (string, required): "trending", "used", "shared"
- `user_email` (string, optional): Specific user (default: current user)
- `resource_type` (string, optional): "document", "person", "site"

**Returns**:
```json
{
  "insights": [
    {
      "type": "document",
      "title": "Q4 Strategy Deck.pptx",
      "location": "SharePoint/Executive/Strategy",
      "trending_score": 0.92,
      "shared_by": ["ceo@company.com", "coo@company.com"],
      "last_accessed": "2025-11-21T09:15:00Z",
      "relevance_reason": "Frequently accessed by leadership team this week"
    }
  ]
}
```

**Microsoft Graph API**: `GET /me/insights/trending`, `GET /me/insights/used`, `GET /me/insights/shared`

---

### 19. find_expert_on_topic
**Description**: Identifies subject matter experts in the organization

**Parameters**:
- `topic` (string, required): Topic or skill area
- `limit` (integer, optional): Max results (default: 5)

**Returns**:
```json
{
  "experts": [
    {
      "name": "Sarah Johnson",
      "title": "Finance Manager",
      "expertise_score": 0.95,
      "evidence": [
        "Authored 12 documents on financial analysis",
        "Frequent participant in budget discussions",
        "Tagged as expert in company directory"
      ],
      "contact": "sarah@company.com",
      "availability": "Usually responds within 2 hours"
    }
  ]
}
```

**Microsoft Graph API**: `GET /me/people`, `GET /search/query` (with KQL)

---

## Teams Integration Tools

### 20. search_teams_conversations
**Description**: Searches Teams chat and channel messages

**Parameters**:
- `query` (string, required): Search keywords
- `chat_type` (string, optional): "one_on_one", "group", "channel" (default: all)
- `date_range_days` (integer, optional): Search last N days (default: 30)

**Returns**:
```json
{
  "messages": [
    {
      "chat_id": "19:meeting_...",
      "message_id": "1605741...",
      "from": "john@company.com",
      "sent_date": "2025-11-20T15:30:00Z",
      "content": "Quick update: CFO approved the budget increase",
      "chat_type": "channel",
      "channel_name": "Finance Team",
      "relevance_score": 0.88
    }
  ]
}
```

**Microsoft Graph API**: `GET /me/chats`, `GET /teams/{id}/channels/{id}/messages`

---

## Configuration & Control Tools

### 21. update_priority_rules
**Description**: Configures email priority scoring rules

**Parameters**:
- `rule_type` (string, required): "vip_sender", "urgent_keyword", "project_priority"
- `rule_config` (object, required): Rule-specific configuration

**Example**:
```json
{
  "rule_type": "vip_sender",
  "rule_config": {
    "email": "ceo@company.com",
    "priority_boost": 3,
    "always_notify": true
  }
}
```

---

### 22. set_approval_workflow
**Description**: Configures which actions require user approval

**Parameters**:
- `action_type` (string, required): "send_email", "schedule_meeting", "delegate_task"
- `approval_required` (boolean, required): true/false
- `threshold` (object, optional): Conditions for requiring approval

**Example**:
```json
{
  "action_type": "send_email",
  "approval_required": true,
  "threshold": {
    "confidence_below": 0.8,
    "recipient_is_external": true
  }
}
```

---

## Summary

**Total Tools**: 22

**Categories**:
- Email Management: 5 tools
- Calendar Management: 4 tools
- Knowledge Management: 4 tools
- Task Coordination: 2 tools
- Meeting Assistant: 2 tools
- Microsoft Graph Insights: 2 tools
- Teams Integration: 1 tool
- Configuration: 2 tools

**Microsoft Graph API Coverage**:
- Mail API: ✓
- Calendar API: ✓
- Files API (OneDrive/SharePoint): ✓
- People API: ✓
- Teams API: ✓
- Insights API: ✓
- Search API: ✓
- Planner API: ✓

**Authentication**: OAuth 2.0 with delegated permissions
**Rate Limiting**: Respects Microsoft Graph throttling limits
**Error Handling**: Graceful degradation with retry logic
