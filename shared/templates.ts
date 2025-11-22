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
