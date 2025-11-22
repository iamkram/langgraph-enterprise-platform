/**
 * Executive Assistant Template
 * To be added to templates.ts
 */

export const executiveAssistantTemplate = {
  id: "executive-assistant",
  name: "Executive Assistant",
  description: "Intelligent assistant that manages emails, calendar, knowledge base, tasks, and meetings using Microsoft 365 integration with automatic learning and minimal maintenance",
  category: "general" as const,
  icon: "👔",
  difficulty: "advanced" as const,
  estimatedSetupTime: "60 seconds",
  
  config: {
    name: "Executive Assistant",
    description: "Intelligent assistant that manages emails, calendar, knowledge base, tasks, and meetings using Microsoft 365 integration",
    agentType: "supervisor" as const,
    model: "gpt-4o",
    workers: [
      {
        name: "email_manager",
        description: "Manages email operations including priority analysis, drafting responses, and extracting action items",
        systemPrompt: `You are an email management specialist using the ReAct (Reasoning + Acting) pattern from hwchase17/react.

Your capabilities:
- analyze_email_priority: Assess email importance and urgency
- draft_email_response: Generate professional email responses
- extract_action_items: Identify tasks and deadlines from emails
- search_similar_emails: Find related correspondence

Always:
1. Think step-by-step about the email context
2. Consider sender importance and message urgency
3. Draft responses that match the user's communication style
4. Extract clear, actionable items with deadlines

Reference: LangSmith Hub prompt hwchase17/react for systematic reasoning`
      },
      {
        name: "calendar_manager",
        description: "Handles calendar operations including finding available slots and scheduling meetings",
        systemPrompt: `You are a calendar management specialist using sequential function calling from homanp/superagent.

Your capabilities:
- find_available_slots: Check calendar availability
- schedule_meeting: Create calendar events
- resolve_conflicts: Handle scheduling conflicts

Always:
1. Check availability before proposing times
2. Consider time zones for all participants
3. Respect user's working hours and preferences
4. Provide multiple options when possible

Reference: LangSmith Hub prompt homanp/superagent for sequential task execution`
      },
      {
        name: "knowledge_manager",
        description: "Manages organizational knowledge base and information retrieval",
        systemPrompt: `You are a knowledge management specialist using assumption checking from smithing-gold/assumption-checker.

Your capabilities:
- search_knowledge_base: Find relevant information
- query_knowledge_graph: Navigate relationships
- get_project_context: Retrieve project details

Always:
1. Verify assumptions before providing information
2. Cross-reference multiple sources
3. Highlight confidence levels in responses
4. Update knowledge base with new insights

Reference: LangSmith Hub prompt smithing-gold/assumption-checker for validation`
      },
      {
        name: "task_coordinator",
        description: "Coordinates tasks and project management",
        systemPrompt: `You are a task coordination specialist using the ReAct pattern.

Your capabilities:
- list_open_tasks: View pending tasks
- get_project_context: Understand project status
- generate_project_summary: Create status reports

Always:
1. Prioritize tasks by urgency and importance
2. Track dependencies between tasks
3. Provide clear status updates
4. Identify blockers and risks

Reference: LangSmith Hub prompt hwchase17/react for systematic task analysis`
      },
      {
        name: "meeting_assistant",
        description: "Assists with meeting preparation and follow-up",
        systemPrompt: `You are a meeting assistant specialist using comprehensive system instructions from ohkgi/superb_system_instruction_prompt.

Your capabilities:
- generate_meeting_brief: Create pre-meeting summaries
- get_attendee_profiles: Research participants
- extract_action_items: Document meeting outcomes

Always:
1. Prepare comprehensive meeting briefs
2. Research attendee backgrounds and roles
3. Document decisions and action items
4. Follow up on commitments

Reference: LangSmith Hub prompt ohkgi/superb_system_instruction_prompt for detailed instructions`
      }
    ],
    tools: [
      {
        name: "analyze_email_priority",
        description: "Analyzes email importance and urgency based on sender, content, and context",
        parameters: {
          email_id: {
            type: "string",
            description: "Unique identifier of the email to analyze",
            required: true
          },
          context: {
            type: "string",
            description: "Additional context about current priorities",
            required: false
          }
        }
      },
      {
        name: "draft_email_response",
        description: "Generates professional email responses based on context and tone",
        parameters: {
          email_id: {
            type: "string",
            description: "ID of the email to respond to",
            required: true
          },
          tone: {
            type: "string",
            description: "Desired tone (formal, casual, urgent)",
            required: false
          },
          key_points: {
            type: "array",
            description: "Main points to address in the response",
            required: true
          }
        }
      },
      {
        name: "extract_action_items",
        description: "Identifies tasks, deadlines, and commitments from email content",
        parameters: {
          email_id: {
            type: "string",
            description: "Email to extract action items from",
            required: true
          }
        }
      },
      {
        name: "search_similar_emails",
        description: "Finds related emails based on topic, sender, or keywords",
        parameters: {
          query: {
            type: "string",
            description: "Search query or keywords",
            required: true
          },
          limit: {
            type: "number",
            description: "Maximum number of results",
            required: false
          }
        }
      },
      {
        name: "find_available_slots",
        description: "Searches calendar for available meeting times",
        parameters: {
          duration_minutes: {
            type: "number",
            description: "Meeting duration in minutes",
            required: true
          },
          attendees: {
            type: "array",
            description: "List of attendee email addresses",
            required: true
          },
          date_range: {
            type: "object",
            description: "Start and end dates to search",
            required: true
          }
        }
      },
      {
        name: "schedule_meeting",
        description: "Creates a calendar event with specified details",
        parameters: {
          title: {
            type: "string",
            description: "Meeting title",
            required: true
          },
          start_time: {
            type: "string",
            description: "Meeting start time (ISO 8601)",
            required: true
          },
          duration_minutes: {
            type: "number",
            description: "Meeting duration",
            required: true
          },
          attendees: {
            type: "array",
            description: "List of attendee emails",
            required: true
          }
        }
      },
      {
        name: "search_knowledge_base",
        description: "Searches organizational knowledge base for relevant information",
        parameters: {
          query: {
            type: "string",
            description: "Search query",
            required: true
          },
          filters: {
            type: "object",
            description: "Optional filters (category, date, author)",
            required: false
          }
        }
      },
      {
        name: "query_knowledge_graph",
        description: "Navigates relationships in the knowledge graph",
        parameters: {
          entity: {
            type: "string",
            description: "Starting entity or concept",
            required: true
          },
          relationship_type: {
            type: "string",
            description: "Type of relationship to explore",
            required: false
          }
        }
      },
      {
        name: "get_project_context",
        description: "Retrieves comprehensive project information and status",
        parameters: {
          project_id: {
            type: "string",
            description: "Project identifier",
            required: true
          }
        }
      },
      {
        name: "list_open_tasks",
        description: "Lists all pending tasks with priorities and deadlines",
        parameters: {
          filter: {
            type: "string",
            description: "Filter criteria (priority, assignee, project)",
            required: false
          }
        }
      },
      {
        name: "generate_project_summary",
        description: "Creates executive summary of project status",
        parameters: {
          project_id: {
            type: "string",
            description: "Project to summarize",
            required: true
          },
          detail_level: {
            type: "string",
            description: "Summary detail level (brief, detailed, comprehensive)",
            required: false
          }
        }
      },
      {
        name: "generate_meeting_brief",
        description: "Creates pre-meeting context summary",
        parameters: {
          meeting_id: {
            type: "string",
            description: "Meeting identifier",
            required: true
          }
        }
      },
      {
        name: "get_attendee_profiles",
        description: "Provides background information on meeting participants",
        parameters: {
          attendee_emails: {
            type: "array",
            description: "List of attendee email addresses",
            required: true
          }
        }
      }
    ],
    security: {
      enablePiiDetection: true,
      enableGuardrails: true,
      enableCheckpointing: true
    }
  },
  
  useCases: [
    "Email triage and response automation",
    "Meeting scheduling and coordination",
    "Knowledge base management and search",
    "Task tracking and project updates",
    "Meeting preparation and follow-up"
  ],
  prerequisites: [
    "Microsoft 365 API access",
    "Email and calendar permissions",
    "Knowledge base integration",
    "Task management system connection"
  ],
  codePreview: `# Executive Assistant Agent
# Manages emails, calendar, knowledge, tasks, and meetings

from langgraph.graph import StateGraph
from langsmith import traceable

@traceable(name="executive_assistant")
def create_executive_assistant():
    workflow = StateGraph()
    
    # Add worker agents
    workflow.add_node("email_manager", email_manager_node)
    workflow.add_node("calendar_manager", calendar_manager_node)
    workflow.add_node("knowledge_manager", knowledge_manager_node)
    workflow.add_node("task_coordinator", task_coordinator_node)
    workflow.add_node("meeting_assistant", meeting_assistant_node)
    
    # Supervisor routing
    workflow.add_node("supervisor", supervisor_node)
    workflow.set_entry_point("supervisor")
    
    return workflow.compile()`
};
