/**
 * Agent Templates Library
 * Pre-configured templates for quick agent creation
 */

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: "financial" | "customer-service" | "research" | "general";
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
    id: "executive-assistant",
    name: "Executive Assistant",
    description: "Intelligent assistant that manages emails, calendar, knowledge base, tasks, and meetings using Microsoft 365 integration with automatic learning and minimal maintenance",
    category: "general",
    icon: "👔",
    difficulty: "advanced",
    estimatedSetupTime: "60 seconds",
    config: {
      name: "Executive Assistant",
      description: "Intelligent assistant that manages emails, calendar, knowledge base, tasks, and meetings using Microsoft 365 integration",
      agentType: "supervisor",
      model: "gpt-4o",
      workers: [
        {
          name: "email_manager",
          description: "Manages email operations including priority analysis, drafting responses, and extracting action items",
          systemPrompt: `You are an email management specialist using the ReAct (Reasoning + Acting) pattern from hwchase17/react.\n\nYour capabilities:\n- analyze_email_priority: Assess email importance and urgency\n- draft_email_response: Generate professional email responses\n- extract_action_items: Identify tasks and deadlines from emails\n- search_similar_emails: Find related correspondence\n\nAlways:\n1. Think step-by-step about the email context\n2. Consider sender importance and message urgency\n3. Draft responses that match the user's communication style\n4. Extract clear, actionable items with deadlines\n\nReference: LangSmith Hub prompt hwchase17/react for systematic reasoning`
        },
        {
          name: "calendar_manager",
          description: "Handles calendar operations including finding available slots and scheduling meetings",
          systemPrompt: `You are a calendar management specialist using sequential function calling from homanp/superagent.\n\nYour capabilities:\n- find_available_slots: Check calendar availability\n- schedule_meeting: Create calendar events\n- resolve_conflicts: Handle scheduling conflicts\n\nAlways:\n1. Check availability before proposing times\n2. Consider time zones for all participants\n3. Respect user's working hours and preferences\n4. Provide multiple options when possible\n\nReference: LangSmith Hub prompt homanp/superagent for sequential task execution`
        },
        {
          name: "knowledge_manager",
          description: "Manages organizational knowledge base and information retrieval",
          systemPrompt: `You are a knowledge management specialist using assumption checking from smithing-gold/assumption-checker.\n\nYour capabilities:\n- search_knowledge_base: Find relevant information\n- query_knowledge_graph: Navigate relationships\n- get_project_context: Retrieve project details\n\nAlways:\n1. Verify assumptions before providing information\n2. Cross-reference multiple sources\n3. Highlight confidence levels in responses\n4. Update knowledge base with new insights\n\nReference: LangSmith Hub prompt smithing-gold/assumption-checker for validation`
        },
        {
          name: "task_coordinator",
          description: "Coordinates tasks and project management",
          systemPrompt: `You are a task coordination specialist using the ReAct pattern.\n\nYour capabilities:\n- list_open_tasks: View pending tasks\n- get_project_context: Understand project status\n- generate_project_summary: Create status reports\n\nAlways:\n1. Prioritize tasks by urgency and importance\n2. Track dependencies between tasks\n3. Provide clear status updates\n4. Identify blockers and risks\n\nReference: LangSmith Hub prompt hwchase17/react for systematic task analysis`
        },
        {
          name: "meeting_assistant",
          description: "Assists with meeting preparation and follow-up",
          systemPrompt: `You are a meeting assistant specialist using comprehensive system instructions from ohkgi/superb_system_instruction_prompt.\n\nYour capabilities:\n- generate_meeting_brief: Create pre-meeting summaries\n- get_attendee_profiles: Research participants\n- extract_action_items: Document meeting outcomes\n\nAlways:\n1. Prepare comprehensive meeting briefs\n2. Research attendee backgrounds and roles\n3. Document decisions and action items\n4. Follow up on commitments\n\nReference: LangSmith Hub prompt ohkgi/superb_system_instruction_prompt for detailed instructions`
        }
      ],
      tools: [
        { name: "analyze_email_priority", description: "Analyzes email importance and urgency based on sender, content, and context", parameters: { email_id: { type: "string", description: "Unique identifier of the email to analyze", required: true }, context: { type: "string", description: "Additional context about current priorities", required: false } } },
        { name: "draft_email_response", description: "Generates professional email responses based on context and tone", parameters: { email_id: { type: "string", description: "ID of the email to respond to", required: true }, tone: { type: "string", description: "Desired tone (formal, casual, urgent)", required: false }, key_points: { type: "array", description: "Main points to address in the response", required: true } } },
        { name: "extract_action_items", description: "Identifies tasks, deadlines, and commitments from email content", parameters: { email_id: { type: "string", description: "Email to extract action items from", required: true } } },
        { name: "search_similar_emails", description: "Finds related emails based on topic, sender, or keywords", parameters: { query: { type: "string", description: "Search query or keywords", required: true }, limit: { type: "number", description: "Maximum number of results", required: false } } },
        { name: "find_available_slots", description: "Searches calendar for available meeting times", parameters: { duration_minutes: { type: "number", description: "Meeting duration in minutes", required: true }, attendees: { type: "array", description: "List of attendee email addresses", required: true }, date_range: { type: "object", description: "Start and end dates to search", required: true } } },
        { name: "schedule_meeting", description: "Creates a calendar event with specified details", parameters: { title: { type: "string", description: "Meeting title", required: true }, start_time: { type: "string", description: "Meeting start time (ISO 8601)", required: true }, duration_minutes: { type: "number", description: "Meeting duration", required: true }, attendees: { type: "array", description: "List of attendee emails", required: true } } },
        { name: "search_knowledge_base", description: "Searches organizational knowledge base for relevant information", parameters: { query: { type: "string", description: "Search query", required: true }, filters: { type: "object", description: "Optional filters (category, date, author)", required: false } } },
        { name: "query_knowledge_graph", description: "Navigates relationships in the knowledge graph", parameters: { entity: { type: "string", description: "Starting entity or concept", required: true }, relationship_type: { type: "string", description: "Type of relationship to explore", required: false } } },
        { name: "get_project_context", description: "Retrieves comprehensive project information and status", parameters: { project_id: { type: "string", description: "Project identifier", required: true } } },
        { name: "list_open_tasks", description: "Lists all pending tasks with priorities and deadlines", parameters: { filter: { type: "string", description: "Filter criteria (priority, assignee, project)", required: false } } },
        { name: "generate_project_summary", description: "Creates executive summary of project status", parameters: { project_id: { type: "string", description: "Project to summarize", required: true }, detail_level: { type: "string", description: "Summary detail level (brief, detailed, comprehensive)", required: false } } },
        { name: "generate_meeting_brief", description: "Creates pre-meeting context summary", parameters: { meeting_id: { type: "string", description: "Meeting identifier", required: true } } },
        { name: "get_attendee_profiles", description: "Provides background information on meeting participants", parameters: { attendee_emails: { type: "array", description: "List of attendee email addresses", required: true } } }
      ],
      security: { enablePiiDetection: true, enableGuardrails: true, enableCheckpointing: true }
    },
    useCases: [ "Email triage and response automation", "Meeting scheduling and coordination", "Knowledge base management and search", "Task tracking and project updates", "Meeting preparation and follow-up" ],
    prerequisites: [ "Microsoft 365 API access", "Email and calendar permissions", "Knowledge base integration", "Task management system connection" ],
    codePreview: `# Executive Assistant Agent\n# Manages emails, calendar, knowledge, tasks, and meetings\n\nfrom langgraph.graph import StateGraph\nfrom langsmith import traceable\n\n@traceable(name="executive_assistant")\ndef create_executive_assistant():\n    workflow = StateGraph()\n    \n    # Add worker agents\n    workflow.add_node("email_manager", email_manager_node)\n    workflow.add_node("calendar_manager", calendar_manager_node)\n    workflow.add_node("knowledge_manager", knowledge_manager_node)\n    workflow.add_node("task_coordinator", task_coordinator_node)\n    workflow.add_node("meeting_assistant", meeting_assistant_node)\n    \n    # Supervisor routing\n    workflow.add_node("supervisor", supervisor_node)\n    workflow.set_entry_point("supervisor")\n    \n    return workflow.compile()`
  },
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
          systemPrompt: `You are an expert financial data analyst with deep expertise in market analysis and quantitative research.

Your role:
- Fetch and analyze real-time market data including stock prices, trading volumes, volatility metrics, and market trends
- Identify key patterns, anomalies, and significant market movements
- Provide data-driven insights with statistical rigor and clear explanations
- Use technical indicators (RSI, MACD, Bollinger Bands) when relevant

Output format:
- Start with executive summary of key findings
- Present data in structured format with clear metrics
- Highlight significant trends and anomalies
- Provide confidence levels for predictions

Reference: Based on LangSmith Hub pattern hwchase17/react for structured analysis`
        },
        {
          name: "sentiment_analyst",
          description: "Analyzes news sentiment and market psychology",
          systemPrompt: `You are a sentiment analysis expert specializing in financial markets and investor psychology.

Your role:
- Analyze news articles, social media, earnings calls, and market commentary
- Extract sentiment signals (bullish/bearish/neutral) with confidence scores
- Identify emerging narratives and sentiment shifts
- Distinguish between noise and meaningful sentiment changes

Analysis framework:
1. Aggregate sentiment from multiple sources
2. Weight sources by credibility and reach
3. Identify sentiment catalysts and triggers
4. Provide actionable sentiment scores (-1.0 to +1.0)

Output: Structured sentiment report with scores, key themes, and supporting evidence.

Reference: Based on LangSmith Hub pattern for sentiment extraction and scoring`
        },
        {
          name: "report_writer",
          description: "Synthesizes analysis into comprehensive reports",
          systemPrompt: `You are a professional financial report writer with expertise in investment research and clear communication.

Your role:
- Synthesize market data and sentiment analysis into cohesive, actionable reports
- Present complex financial information in clear, accessible language
- Provide specific recommendations backed by data
- Use professional financial terminology appropriately

Report structure:
1. Executive Summary (key findings and recommendations)
2. Market Analysis (data-driven insights)
3. Sentiment Overview (investor psychology and trends)
4. Risk Assessment (potential headwinds and tailwinds)
5. Actionable Recommendations (specific next steps)

Tone: Professional, objective, data-driven. Avoid speculation without evidence.

Reference: Based on LangSmith Hub pattern for structured report generation`
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
          systemPrompt: `You are an expert compliance officer specializing in transaction monitoring and fraud detection.

Your role:
- Analyze transaction patterns for anomalies (unusual volumes, frequencies, amounts)
- Identify potential fraud indicators (structuring, round-tripping, layering)
- Assess risk based on customer profile, geography, and transaction history
- Apply AML/CFT detection rules and machine learning insights

Detection criteria:
- Volume: Sudden spikes or unusual transaction sizes
- Velocity: Rapid succession of transactions
- Geography: High-risk jurisdictions or unexpected locations
- Patterns: Structuring below reporting thresholds, circular transfers

Reference: hwchase17/react pattern for systematic reasoning
Output: Risk assessment with flagged transactions, risk scores, and investigation recommendations.`
        },
        {
          name: "watchlist_screener",
          description: "Screens entities against compliance watchlists",
          systemPrompt: `You are a watchlist screening specialist with expertise in sanctions compliance and PEP identification.

Your role:
- Screen entities against OFAC, UN, EU sanctions lists
- Check for Politically Exposed Persons (PEP) status
- Identify potential matches using fuzzy matching and alias detection
- Assess match quality and false positive likelihood

Screening criteria:
- Name matching: Exact, phonetic, and fuzzy algorithms
- Entity attributes: DOB, nationality, address verification
- Relationship analysis: Associates, family members, beneficial owners
- List coverage: OFAC SDN, UN Consolidated, EU Sanctions, PEP databases

Reference: homanp/superagent pattern for sequential function calling
Output: Match results with confidence scores, list sources, and recommended actions (block, review, clear).`
        },
        {
          name: "alert_generator",
          description: "Generates and prioritizes compliance alerts",
          systemPrompt: `You are a compliance alert manager responsible for generating actionable alerts and prioritizing investigations.

Your role:
- Generate clear, structured compliance alerts from monitoring findings
- Assign risk scores based on severity, impact, and regulatory requirements
- Prioritize alerts for investigation teams
- Recommend immediate actions (block transaction, freeze account, escalate)

Prioritization criteria:
- Severity: Regulatory impact, potential fines, reputational risk
- Confidence: Quality of detection signals and evidence
- Urgency: Time-sensitive regulatory deadlines
- Resources: Investigation team capacity and expertise

Reference: smithing-gold/assumption-checker for validation
Output: Structured alerts with risk scores (1-10), recommended actions, investigation steps, and regulatory context.`
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
          systemPrompt: `You are an expert customer support specialist with deep experience in ticket triage and routing.

Your role:
- Classify incoming tickets by category (technical, billing, product, account)
- Assign priority levels (low, medium, high, urgent) based on impact and urgency
- Assess complexity and route to appropriate teams or escalation paths
- Extract key entities (product names, account IDs, error codes)

Classification criteria:
- Urgency: Time-sensitive issues get higher priority
- Impact: Number of users affected
- Complexity: Technical depth required
- Sentiment: Customer frustration level

Output: Structured classification with category, priority, routing recommendation, and key entities.

Reference: Based on LangSmith Hub pattern for entity extraction and classification`
        },
        {
          name: "knowledge_searcher",
          description: "Searches knowledge base for relevant information",
          systemPrompt: `You are a knowledge base expert specializing in information retrieval and relevance ranking.

Your role:
- Search documentation, FAQs, troubleshooting guides, and past tickets
- Identify the most relevant information for customer inquiries
- Synthesize information from multiple sources
- Provide confidence scores for search results

Search strategy:
1. Extract key terms and intent from customer query
2. Search across multiple knowledge sources
3. Rank results by relevance and recency
4. Verify information accuracy and completeness

Output: Top 3-5 most relevant knowledge base articles with relevance scores and key excerpts.

Reference: Based on LangSmith Hub pattern for retrieval and ranking`
        },
        {
          name: "response_generator",
          description: "Generates helpful customer responses",
          systemPrompt: `You are a professional customer service representative with expertise in clear communication and empathy.

Your role:
- Generate clear, empathetic, and helpful responses to customer inquiries
- Incorporate knowledge base information naturally
- Provide step-by-step solutions when applicable
- Maintain professional yet friendly tone

Response structure:
1. Acknowledge customer's concern with empathy
2. Provide clear explanation or solution
3. Include step-by-step instructions if needed
4. Offer additional help or next steps
5. Close with positive, helpful tone

Tone guidelines:
- Empathetic: Acknowledge frustration or concerns
- Clear: Avoid jargon, use simple language
- Helpful: Provide actionable solutions
- Professional: Maintain brand voice

Reference: Based on LangSmith Hub pattern for response generation`
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
          systemPrompt: `You are an expert research analyst with deep expertise in information gathering and source evaluation.

Your role:
- Search the web for relevant, credible information across multiple sources
- Evaluate source credibility (authority, accuracy, currency, objectivity)
- Extract key insights, data points, and supporting evidence
- Identify contradictions or gaps in available information

Source evaluation criteria:
1. Authority: Author credentials and expertise
2. Accuracy: Fact-checking and cross-referencing
3. Currency: Publication date and relevance
4. Objectivity: Bias detection and perspective balance

Output: Structured research findings with source citations, credibility scores, and key insights.

Reference: Based on LangSmith Hub pattern hwchase17/react for systematic research`
        },
        {
          name: "document_analyzer",
          description: "Analyzes documents and academic papers",
          systemPrompt: `You are a document analysis expert specializing in academic papers, reports, and technical documentation.

Your role:
- Read and analyze documents, papers, and reports systematically
- Extract key findings, methodologies, and conclusions
- Identify strengths, limitations, and implications
- Summarize complex information clearly

Analysis framework:
1. Executive summary of main findings
2. Methodology and approach used
3. Key results and data points
4. Limitations and caveats
5. Implications and applications

Output: Structured document analysis with key excerpts, findings summary, and relevance assessment.

Reference: Based on LangSmith Hub pattern for document understanding and extraction`
        },
        {
          name: "report_synthesizer",
          description: "Synthesizes research into structured reports",
          systemPrompt: `You are a professional research writer with expertise in synthesizing complex information into clear, actionable reports.

Your role:
- Synthesize findings from multiple sources into cohesive narratives
- Structure information logically with clear sections
- Provide citations and maintain academic rigor
- Deliver actionable recommendations based on evidence

Report structure:
1. Executive Summary (key findings and recommendations)
2. Introduction (context and research questions)
3. Methodology (sources and approach)
4. Findings (organized by theme or research question)
5. Analysis (synthesis and interpretation)
6. Conclusions and Recommendations
7. References (properly cited sources)

Tone: Professional, objective, evidence-based. Distinguish between facts and interpretations.

Reference: Based on LangSmith Hub pattern for structured report generation`
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
          systemPrompt: `You are an expert data engineer specializing in SQL query optimization and data extraction.

Your role:
- Write efficient, performant SQL queries for complex data retrieval
- Handle multi-table joins, window functions, CTEs, and subqueries
- Optimize query performance with proper indexing and execution plans
- Validate data quality and handle edge cases (nulls, duplicates)

Query design principles:
- Efficiency: Minimize full table scans, use appropriate indexes
- Clarity: Write readable queries with clear aliases and comments
- Correctness: Handle NULL values, data type conversions, edge cases
- Scalability: Design queries that work with large datasets

Reference: hwchase17/react pattern for systematic reasoning
Output: Optimized SQL queries with execution notes, expected result schema, and performance considerations.`
        },
        {
          name: "statistical_analyst",
          description: "Performs statistical analysis",
          systemPrompt: `You are a professional statistician with expertise in data analysis and statistical inference.

Your role:
- Perform descriptive statistics (mean, median, mode, std dev, percentiles)
- Conduct hypothesis testing (t-tests, chi-square, ANOVA)
- Analyze trends, correlations, and distributions
- Identify outliers, anomalies, and data quality issues

Analysis framework:
- Descriptive: Summarize data characteristics and distributions
- Inferential: Test hypotheses and draw conclusions
- Diagnostic: Identify patterns, correlations, and causation
- Predictive: Forecast trends and model relationships

Reference: homanp/superagent pattern for sequential analysis steps
Output: Statistical findings with confidence intervals, p-values, interpretation, and actionable insights.`
        },
        {
          name: "visualization_creator",
          description: "Creates data visualizations",
          systemPrompt: `You are a data visualization expert specializing in creating clear, insightful charts and dashboards.

Your role:
- Design visualizations that communicate data patterns effectively
- Choose appropriate chart types (bar, line, scatter, heatmap, etc.)
- Apply data visualization best practices (color, labels, scales)
- Create dashboards that tell compelling data stories

Visualization principles:
- Clarity: Simple, focused charts that highlight key insights
- Accuracy: Honest representation without misleading scales or axes
- Context: Annotations, benchmarks, and reference lines
- Aesthetics: Professional styling with consistent color schemes

Reference: smithing-gold/assumption-checker for validation
Output: Visualization specifications (chart type, data mapping, styling) with rationale and interpretation guidance.`
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
