/**
 * Agent Templates Library
 * Pre-configured templates for quick agent creation
 */

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: "financial" | "customer-service" | "research" | "general" | "productivity";
  icon: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedSetupTime: string;
  
  // Pre-filled form data
  config: {
    name: string;
    description: string;
    agentType: "supervisor" | "single" | "sequential";
    model: string;
    workers: Array<{
      name: string;
      description: string;
      systemPrompt: string;
    }>;
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, {
        type: string;
        description: string;
        required: boolean;
      }>;
    }>;
    security: {
      enablePiiDetection: boolean;
      enableGuardrails: boolean;
      enableCheckpointing: boolean;
    };
  };
  
  // Documentation
  useCases: string[];
  prerequisites: string[];
  codePreview: string;
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: "financial-analysis",
    name: "Financial Analysis Agent",
    description: "Multi-agent system for comprehensive market analysis with sentiment scoring and report generation",
    category: "financial",
    icon: "📊",
    difficulty: "intermediate",
    estimatedSetupTime: "30 seconds",
    config: {
      name: "Financial Analysis Agent",
      description: "Analyzes market data, performs sentiment analysis, and generates comprehensive financial reports",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "market_data_researcher",
          description: "Fetches and analyzes market data",
          systemPrompt: "You are a financial data analyst. Fetch and analyze market data including stock prices, trading volumes, and market trends. Provide clear, data-driven insights."
        },
        {
          name: "sentiment_analyst",
          description: "Analyzes news sentiment and market psychology",
          systemPrompt: "You are a sentiment analysis expert. Analyze news articles, social media, and market commentary to gauge investor sentiment. Provide sentiment scores and key insights."
        },
        {
          name: "report_writer",
          description: "Synthesizes analysis into comprehensive reports",
          systemPrompt: "You are a financial report writer. Synthesize market data and sentiment analysis into clear, actionable investment reports. Use professional financial terminology."
        }
      ],
      tools: [
        {
          name: "fetch_stock_price",
          description: "Fetches current stock price and trading volume",
          parameters: {
            symbol: {
              type: "string",
              description: "Stock ticker symbol (e.g., AAPL, GOOGL)",
              required: true
            }
          }
        },
        {
          name: "analyze_sentiment",
          description: "Analyzes sentiment of financial news",
          parameters: {
            query: {
              type: "string",
              description: "Search query for news articles",
              required: true
            },
            days: {
              type: "number",
              description: "Number of days to look back",
              required: false
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
      "Automated daily market analysis reports",
      "Investment research and due diligence",
      "Portfolio performance monitoring",
      "Market sentiment tracking"
    ],
    prerequisites: [
      "Financial data API access (e.g., Alpha Vantage, Yahoo Finance)",
      "News API for sentiment analysis",
      "Basic understanding of financial markets"
    ],
    codePreview: `# Financial Analysis Agent
supervisor = create_supervisor(
    workers=["market_data_researcher", "sentiment_analyst", "report_writer"],
    tools=[fetch_stock_price, analyze_sentiment],
    checkpointing=True
)`
  },
  
  {
    id: "compliance-monitoring",
    name: "Compliance Monitoring Agent",
    description: "Automated compliance monitoring with fraud detection and watchlist screening",
    category: "financial",
    icon: "🛡️",
    difficulty: "advanced",
    estimatedSetupTime: "45 seconds",
    config: {
      name: "Compliance Monitoring Agent",
      description: "Monitors transactions for fraud, screens against watchlists, and generates compliance alerts",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "transaction_monitor",
          description: "Monitors transactions for suspicious patterns",
          systemPrompt: "You are a compliance officer specializing in transaction monitoring. Identify suspicious patterns, unusual transaction volumes, and potential fraud indicators."
        },
        {
          name: "watchlist_screener",
          description: "Screens entities against compliance watchlists",
          systemPrompt: "You are a watchlist screening specialist. Check entities against OFAC, sanctions lists, and PEP databases. Flag any matches for review."
        },
        {
          name: "alert_generator",
          description: "Generates and prioritizes compliance alerts",
          systemPrompt: "You are a compliance alert manager. Generate clear, actionable alerts with risk scores and recommended actions. Prioritize based on severity."
        }
      ],
      tools: [
        {
          name: "check_watchlist",
          description: "Checks entity against compliance watchlists",
          parameters: {
            entity_name: {
              type: "string",
              description: "Name of person or organization to check",
              required: true
            },
            entity_type: {
              type: "string",
              description: "Type: person or organization",
              required: true
            }
          }
        },
        {
          name: "analyze_transaction_pattern",
          description: "Analyzes transaction patterns for anomalies",
          parameters: {
            account_id: {
              type: "string",
              description: "Account identifier",
              required: true
            },
            time_period: {
              type: "string",
              description: "Time period to analyze (e.g., '30d', '90d')",
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
      "Real-time transaction monitoring",
      "Automated watchlist screening",
      "Fraud detection and prevention",
      "Regulatory compliance reporting"
    ],
    prerequisites: [
      "Access to transaction data",
      "Watchlist API or database",
      "Compliance policies and thresholds configured"
    ],
    codePreview: `# Compliance Monitoring Agent
supervisor = create_supervisor(
    workers=["transaction_monitor", "watchlist_screener", "alert_generator"],
    tools=[check_watchlist, analyze_transaction_pattern],
    security_level="high"
)`
  },
  
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Intelligent customer support with ticket routing, knowledge base search, and response generation",
    category: "customer-service",
    icon: "💬",
    difficulty: "beginner",
    estimatedSetupTime: "20 seconds",
    config: {
      name: "Customer Support Agent",
      description: "Handles customer inquiries, searches knowledge base, and generates helpful responses",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "ticket_classifier",
          description: "Classifies and routes customer tickets",
          systemPrompt: "You are a customer support specialist. Classify incoming tickets by category, priority, and complexity. Route to appropriate teams."
        },
        {
          name: "knowledge_searcher",
          description: "Searches knowledge base for relevant information",
          systemPrompt: "You are a knowledge base expert. Search documentation, FAQs, and past tickets to find relevant information for customer inquiries."
        },
        {
          name: "response_generator",
          description: "Generates helpful customer responses",
          systemPrompt: "You are a customer service representative. Generate clear, empathetic, and helpful responses to customer inquiries. Use knowledge base information."
        }
      ],
      tools: [
        {
          name: "search_knowledge_base",
          description: "Searches internal knowledge base",
          parameters: {
            query: {
              type: "string",
              description: "Search query",
              required: true
            },
            category: {
              type: "string",
              description: "Optional category filter",
              required: false
            }
          }
        },
        {
          name: "create_ticket",
          description: "Creates support ticket for escalation",
          parameters: {
            title: {
              type: "string",
              description: "Ticket title",
              required: true
            },
            description: {
              type: "string",
              description: "Detailed description",
              required: true
            },
            priority: {
              type: "string",
              description: "Priority level: low, medium, high, urgent",
              required: true
            }
          }
        }
      ],
      security: {
        enablePiiDetection: true,
        enableGuardrails: true,
        enableCheckpointing: false
      }
    },
    useCases: [
      "24/7 automated customer support",
      "Ticket classification and routing",
      "Knowledge base-powered responses",
      "Escalation management"
    ],
    prerequisites: [
      "Knowledge base or documentation",
      "Ticketing system API access",
      "Customer support policies"
    ],
    codePreview: `# Customer Support Agent
supervisor = create_supervisor(
    workers=["ticket_classifier", "knowledge_searcher", "response_generator"],
    tools=[search_knowledge_base, create_ticket]
)`
  },
  
  {
    id: "research-assistant",
    name: "Research Assistant Agent",
    description: "Comprehensive research agent with web search, document analysis, and report synthesis",
    category: "research",
    icon: "🔬",
    difficulty: "intermediate",
    estimatedSetupTime: "30 seconds",
    config: {
      name: "Research Assistant Agent",
      description: "Conducts comprehensive research across multiple sources and synthesizes findings into structured reports",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "web_researcher",
          description: "Searches and analyzes web sources",
          systemPrompt: "You are a research analyst. Search the web for relevant information, evaluate source credibility, and extract key insights."
        },
        {
          name: "document_analyzer",
          description: "Analyzes documents and academic papers",
          systemPrompt: "You are a document analysis expert. Read and analyze documents, papers, and reports. Extract key findings, methodologies, and conclusions."
        },
        {
          name: "report_synthesizer",
          description: "Synthesizes research into structured reports",
          systemPrompt: "You are a research writer. Synthesize findings from multiple sources into clear, well-structured reports with citations and recommendations."
        }
      ],
      tools: [
        {
          name: "web_search",
          description: "Searches the web for information",
          parameters: {
            query: {
              type: "string",
              description: "Search query",
              required: true
            },
            num_results: {
              type: "number",
              description: "Number of results to return",
              required: false
            }
          }
        },
        {
          name: "analyze_document",
          description: "Analyzes document content",
          parameters: {
            document_url: {
              type: "string",
              description: "URL or path to document",
              required: true
            },
            focus_areas: {
              type: "string",
              description: "Specific areas to focus on",
              required: false
            }
          }
        }
      ],
      security: {
        enablePiiDetection: false,
        enableGuardrails: true,
        enableCheckpointing: true
      }
    },
    useCases: [
      "Market research and competitive analysis",
      "Academic literature reviews",
      "Due diligence research",
      "Trend analysis and forecasting"
    ],
    prerequisites: [
      "Web search API access",
      "Document processing capabilities",
      "Research topic and scope defined"
    ],
    codePreview: `# Research Assistant Agent
supervisor = create_supervisor(
    workers=["web_researcher", "document_analyzer", "report_synthesizer"],
    tools=[web_search, analyze_document]
)`
  },
  
  {
    id: "data-analyst",
    name: "Data Analysis Agent",
    description: "Automated data analysis with SQL queries, statistical analysis, and visualization generation",
    category: "general",
    icon: "📈",
    difficulty: "intermediate",
    estimatedSetupTime: "30 seconds",
    config: {
      name: "Data Analysis Agent",
      description: "Analyzes datasets, generates insights, and creates visualizations",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "data_querier",
          description: "Queries databases and datasets",
          systemPrompt: "You are a data engineer. Write efficient SQL queries to extract relevant data. Handle complex joins, aggregations, and filtering."
        },
        {
          name: "statistical_analyst",
          description: "Performs statistical analysis",
          systemPrompt: "You are a statistician. Perform statistical analysis including descriptive statistics, hypothesis testing, and trend analysis. Interpret results clearly."
        },
        {
          name: "visualization_creator",
          description: "Creates data visualizations",
          systemPrompt: "You are a data visualization expert. Create clear, insightful visualizations that communicate data patterns and insights effectively."
        }
      ],
      tools: [
        {
          name: "execute_sql",
          description: "Executes SQL query on database",
          parameters: {
            query: {
              type: "string",
              description: "SQL query to execute",
              required: true
            },
            database: {
              type: "string",
              description: "Target database name",
              required: false
            }
          }
        },
        {
          name: "generate_chart",
          description: "Generates data visualization",
          parameters: {
            chart_type: {
              type: "string",
              description: "Type: line, bar, scatter, pie, etc.",
              required: true
            },
            data: {
              type: "string",
              description: "JSON data for visualization",
              required: true
            },
            title: {
              type: "string",
              description: "Chart title",
              required: true
            }
          }
        }
      ],
      security: {
        enablePiiDetection: true,
        enableGuardrails: false,
        enableCheckpointing: false
      }
    },
    useCases: [
      "Automated reporting and dashboards",
      "Ad-hoc data analysis",
      "Business intelligence insights",
      "Data quality monitoring"
    ],
    prerequisites: [
      "Database access credentials",
      "Data schema documentation",
      "Visualization library setup"
    ],
    codePreview: `# Data Analysis Agent
supervisor = create_supervisor(
    workers=["data_querier", "statistical_analyst", "visualization_creator"],
    tools=[execute_sql, generate_chart]
)`
  },

  {
    id: "executive-assistant",
    name: "Executive Assistant (Microsoft 365)",
    description: "AI-powered executive assistant with Microsoft 365 integration, intelligent email management, knowledge graph, and productivity automation for executives managing 30+ direct reports",
    category: "productivity",
    icon: "👔",
    difficulty: "advanced",
    estimatedSetupTime: "60 seconds",
    config: {
      name: "Executive Assistant",
      description: "Intelligent assistant that manages emails, calendar, knowledge base, tasks, and meetings using Microsoft 365 integration with automatic learning and minimal maintenance",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "email_manager",
          description: "Analyzes email priority, drafts responses, and extracts action items",
          systemPrompt: "You are an executive email manager. Analyze incoming emails for priority and urgency, draft context-aware responses based on previous conversations and knowledge base, extract action items and deadlines, and categorize emails by project. Always maintain professional tone and consider the executive's communication style."
        },
        {
          name: "calendar_manager",
          description: "Manages calendar, finds meeting times, and resolves conflicts",
          systemPrompt: "You are a calendar management specialist. Find optimal meeting times considering attendee availability and time zones, resolve scheduling conflicts, protect focus time blocks, prepare meeting context, and track action items. Prioritize efficiency and minimize meeting overhead."
        },
        {
          name: "knowledge_manager",
          description: "Maintains knowledge graph and searches organizational knowledge",
          systemPrompt: "You are a knowledge management expert. Index and search across emails, OneDrive, SharePoint, and Teams. Build and maintain a knowledge graph of people, projects, topics, and decisions. Extract relevant context for email drafting and decision-making. Ensure zero-maintenance automatic updates."
        },
        {
          name: "task_coordinator",
          description: "Tracks tasks across projects and monitors team progress",
          systemPrompt: "You are a task coordination specialist managing 30+ direct reports. Track tasks across all projects, monitor progress, suggest optimal task assignments, escalate blockers, and generate executive summaries. Focus on delegation efficiency and workload balance."
        },
        {
          name: "meeting_assistant",
          description: "Prepares meeting briefs and tracks follow-ups",
          systemPrompt: "You are a meeting preparation expert. Generate pre-meeting briefs with relevant context, provide attendee background, suggest agenda items, extract post-meeting action items, and track follow-ups. Ensure executives are always well-prepared and follow-through is maintained."
        }
      ],
      tools: [
        {
          name: "analyze_email_priority",
          description: "Analyzes email to determine priority score and urgency level",
          parameters: {
            email_id: {
              type: "string",
              description: "The unique identifier of the email",
              required: true
            },
            sender_email: {
              type: "string",
              description: "Email address of the sender",
              required: true
            },
            subject: {
              type: "string",
              description: "Email subject line",
              required: true
            },
            body_preview: {
              type: "string",
              description: "First 200 characters of email body",
              required: true
            }
          }
        },
        {
          name: "draft_email_response",
          description: "Generates context-aware email response based on conversation history",
          parameters: {
            email_id: {
              type: "string",
              description: "ID of email to respond to",
              required: true
            },
            response_type: {
              type: "string",
              description: "Type: acknowledge, detailed_response, decline, delegate",
              required: true
            },
            key_points: {
              type: "array",
              description: "Specific points to address in response",
              required: false
            }
          }
        },
        {
          name: "extract_action_items",
          description: "Identifies tasks, deadlines, and follow-ups from email",
          parameters: {
            email_id: {
              type: "string",
              description: "Email to analyze",
              required: true
            },
            email_body: {
              type: "string",
              description: "Full email content",
              required: true
            }
          }
        },
        {
          name: "search_similar_emails",
          description: "Finds previous emails related to current topic or sender",
          parameters: {
            topic_keywords: {
              type: "array",
              description: "Keywords to search for",
              required: true
            },
            date_range_days: {
              type: "number",
              description: "Search last N days (default: 90)",
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
              description: "Meeting length",
              required: true
            },
            attendees: {
              type: "array",
              description: "List of attendee email addresses",
              required: true
            },
            date_range: {
              type: "object",
              description: "Start and end dates for search",
              required: true
            }
          }
        },
        {
          name: "schedule_meeting",
          description: "Creates calendar event with specified attendees",
          parameters: {
            subject: {
              type: "string",
              description: "Meeting title",
              required: true
            },
            start_time: {
              type: "string",
              description: "ISO 8601 datetime",
              required: true
            },
            end_time: {
              type: "string",
              description: "ISO 8601 datetime",
              required: true
            },
            attendees: {
              type: "array",
              description: "Email addresses",
              required: true
            }
          }
        },
        {
          name: "search_knowledge_base",
          description: "Full-text search across emails, documents, and knowledge graph",
          parameters: {
            query: {
              type: "string",
              description: "Search query",
              required: true
            },
            sources: {
              type: "array",
              description: "Sources to search: email, onedrive, sharepoint, teams",
              required: false
            }
          }
        },
        {
          name: "query_knowledge_graph",
          description: "Graph traversal queries to find relationships and connections",
          parameters: {
            entity_type: {
              type: "string",
              description: "Entity type: person, project, topic, document",
              required: true
            },
            entity_id: {
              type: "string",
              description: "Entity identifier",
              required: true
            },
            depth: {
              type: "number",
              description: "Traversal depth (default: 2)",
              required: false
            }
          }
        },
        {
          name: "get_project_context",
          description: "Retrieves comprehensive information about a specific project",
          parameters: {
            project_name: {
              type: "string",
              description: "Project identifier",
              required: true
            },
            include_team: {
              type: "boolean",
              description: "Include team members (default: true)",
              required: false
            }
          }
        },
        {
          name: "list_open_tasks",
          description: "Retrieves all pending tasks across projects and direct reports",
          parameters: {
            filter_by_project: {
              type: "string",
              description: "Optional project name filter",
              required: false
            },
            due_within_days: {
              type: "number",
              description: "Tasks due in next N days",
              required: false
            }
          }
        },
        {
          name: "generate_project_summary",
          description: "Creates executive summary of project status",
          parameters: {
            project_name: {
              type: "string",
              description: "Specific project (default: all projects)",
              required: false
            },
            include_metrics: {
              type: "boolean",
              description: "Include KPIs (default: true)",
              required: false
            }
          }
        },
        {
          name: "generate_meeting_brief",
          description: "Creates pre-meeting context summary",
          parameters: {
            event_id: {
              type: "string",
              description: "Meeting event ID",
              required: true
            },
            include_previous_meetings: {
              type: "boolean",
              description: "Include history (default: true)",
              required: false
            }
          }
        },
        {
          name: "get_attendee_profiles",
          description: "Provides background information on meeting participants",
          parameters: {
            attendee_emails: {
              type: "array",
              description: "List of participant emails",
              required: true
            },
            include_recent_interactions: {
              type: "boolean",
              description: "Include interaction history (default: true)",
              required: false
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
      "Intelligent email triage and response drafting for executives",
      "Automated calendar management with conflict resolution",
      "Personal knowledge base built from Microsoft 365 data",
      "Multi-project tracking across 30+ direct reports",
      "Meeting preparation with context and attendee intelligence",
      "Zero-maintenance knowledge graph that learns automatically",
      "Task coordination and delegation recommendations",
      "Executive productivity optimization"
    ],
    prerequisites: [
      "Microsoft 365 account (E3 or E5 license recommended)",
      "Microsoft Graph API permissions: Mail.ReadWrite, Calendars.ReadWrite, Files.Read.All, Sites.Read.All, User.Read.All, Chat.Read",
      "Azure AD app registration for OAuth authentication",
      "OneDrive and SharePoint sites configured",
      "Teams integration enabled",
      "Initial configuration of priority rules and approval workflows"
    ],
    codePreview: `# Executive Assistant Agent with Microsoft 365 Integration
supervisor = create_supervisor(
    workers=[
        "email_manager",
        "calendar_manager", 
        "knowledge_manager",
        "task_coordinator",
        "meeting_assistant"
    ],
    tools=[
        # Email Management (5 tools)
        analyze_email_priority,
        draft_email_response,
        extract_action_items,
        search_similar_emails,
        categorize_email,
        
        # Calendar Management (4 tools)
        find_available_slots,
        schedule_meeting,
        suggest_reschedule,
        get_meeting_context,
        
        # Knowledge Management (4 tools)
        search_knowledge_base,
        query_knowledge_graph,
        extract_document_knowledge,
        get_project_context,
        
        # Task Coordination (2 tools)
        list_open_tasks,
        generate_project_summary,
        
        # Meeting Assistant (2 tools)
        generate_meeting_brief,
        get_attendee_profiles,
        
        # Microsoft Graph Integration (3 tools)
        query_microsoft_graph_insights,
        find_expert_on_topic,
        search_teams_conversations
    ],
    microsoft_365_integration=True,
    auto_learning=True,
    checkpointing=True,
    security_level="high"
)`
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AgentTemplate | undefined {
  return agentTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: AgentTemplate["category"]): AgentTemplate[] {
  return agentTemplates.filter(t => t.category === category);
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: AgentTemplate["difficulty"]): AgentTemplate[] {
  return agentTemplates.filter(t => t.difficulty === difficulty);
}
