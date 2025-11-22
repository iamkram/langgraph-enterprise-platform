import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

/**
 * AI Assistant Router
 * 
 * Provides LLM-assisted generation for custom tools and agents.
 * Uses expert system prompts to guide users through creating specifications.
 */

const TOOL_GENERATION_SYSTEM_PROMPT = `You are an expert LangGraph tool specification assistant. Your role is to help users create custom tool specifications for their LangGraph agents.

A tool in LangGraph has the following structure:
- **name**: A unique identifier (snake_case, e.g., "search_web", "send_email")
- **description**: Clear explanation of what the tool does and when to use it
- **parameters**: JSON schema defining the tool's input parameters

When a user describes what they want their tool to do, you should:
1. Ask clarifying questions if needed (What inputs does it need? What does it return?)
2. Generate a complete tool specification in JSON format
3. Ensure the tool name is descriptive and follows snake_case convention
4. Write a clear description that helps the agent know when to use this tool
5. Define appropriate parameter schemas with types, descriptions, and required fields

Example tool specification:
\`\`\`json
{
  "name": "search_web",
  "description": "Search the web for information on a given topic. Use this when you need current information or facts that you don't have in your knowledge base.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query to look up"
      },
      "max_results": {
        "type": "number",
        "description": "Maximum number of results to return (default: 5)"
      }
    },
    "required": ["query"]
  }
}
\`\`\`

Respond conversationally, ask questions when needed, and provide the JSON specification when you have enough information.`;

const AGENT_GENERATION_SYSTEM_PROMPT = `You are an expert LangGraph agent configuration assistant. Your role is to help users create custom agent specifications for their LangGraph multi-agent systems.

An agent (worker) in LangGraph has the following structure:
- **name**: A unique identifier for the agent (e.g., "research_agent", "writer_agent")
- **role**: A clear, concise description of the agent's responsibility
- **goal**: What the agent is trying to achieve
- **backstory**: Context about the agent's expertise and approach
- **tools**: List of tool names this agent can use
- **allow_delegation**: Whether this agent can delegate to other agents

When a user describes what they want their agent to do, you should:
1. Ask clarifying questions (What's the agent's main responsibility? What tools does it need?)
2. Generate a complete agent specification in JSON format
3. Write a compelling role, goal, and backstory that gives the agent clear direction
4. Suggest appropriate tools from the available tool list
5. Recommend whether delegation should be enabled

Example agent specification:
\`\`\`json
{
  "name": "research_agent",
  "role": "Senior Research Analyst",
  "goal": "Conduct thorough research on given topics and compile comprehensive findings",
  "backstory": "You are an experienced research analyst with expertise in gathering, analyzing, and synthesizing information from multiple sources. You excel at finding relevant data and presenting it in a clear, structured format.",
  "tools": ["search_web", "read_document", "extract_data"],
  "allow_delegation": false
}
\`\`\`

Respond conversationally, ask questions when needed, and provide the JSON specification when you have enough information.`;

export const aiAssistantRouter = router({
  /**
   * Generate custom tool specification with LLM assistance
   */
  generateTool: protectedProcedure
    .input(z.object({
      userMessage: z.string().describe("User's description or question about the tool"),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional().describe("Previous conversation messages for context"),
    }))
    .mutation(async ({ input }) => {
      const messages = [
        { role: "system" as const, content: TOOL_GENERATION_SYSTEM_PROMPT },
        ...(input.conversationHistory || []).map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content,
        })),
        { role: "user" as const, content: input.userMessage },
      ];

      const response = await invokeLLM({ messages });
      
      const content = response.choices[0]?.message?.content || "";
      const assistantMessage = typeof content === "string" ? content : "";
      
      // Try to extract JSON if present
      const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
      let toolSpec = null;
      
      if (jsonMatch) {
        try {
          toolSpec = JSON.parse(jsonMatch[1]);
        } catch (e) {
          // JSON parsing failed, toolSpec remains null
        }
      }

      return {
        message: assistantMessage,
        toolSpec,
      };
    }),

  /**
   * Generate custom agent specification with LLM assistance
   */
  generateAgent: protectedProcedure
    .input(z.object({
      userMessage: z.string().describe("User's description or question about the agent"),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional().describe("Previous conversation messages for context"),
      availableTools: z.array(z.string()).optional().describe("List of available tool names to suggest"),
    }))
    .mutation(async ({ input }) => {
      let systemPrompt = AGENT_GENERATION_SYSTEM_PROMPT;
      
      // Add available tools context if provided
      if (input.availableTools && input.availableTools.length > 0) {
        systemPrompt += `\n\nAvailable tools for this agent:\n${input.availableTools.map(t => `- ${t}`).join("\n")}`;
      }
      
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(input.conversationHistory || []).map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content,
        })),
        { role: "user" as const, content: input.userMessage },
      ];

      const response = await invokeLLM({ messages });
      
      const content = response.choices[0]?.message?.content || "";
      const assistantMessage = typeof content === "string" ? content : "";
      
      // Try to extract JSON if present
      const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
      let agentSpec = null;
      
      if (jsonMatch) {
        try {
          agentSpec = JSON.parse(jsonMatch[1]);
        } catch (e) {
          // JSON parsing failed, agentSpec remains null
        }
      }

      return {
        message: assistantMessage,
        agentSpec,
      };
    }),
});
