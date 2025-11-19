import { AgentConfigInput, ToolConfigInput } from "@shared/agentValidation";

export function generateSupervisorCode(config: AgentConfigInput): string {
  const { name, workerAgents = [], modelName, systemPrompt, maxIterations } = config;
  
  const workersStr = workerAgents.map(w => `"${w}"`).join(", ");
  const systemPromptStr = systemPrompt || "You are a supervisor agent that routes tasks to specialized worker agents.";
  
  return `from typing import Literal
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.types import Command
from pydantic import BaseModel

# Supervisor Agent: ${name}

class SupervisorCommand(BaseModel):
    """Command for routing to next agent."""
    goto: Literal[${workersStr}, "FINISH"]
    update: dict = {}

def create_supervisor():
    """Create supervisor agent with LLM-powered routing."""
    llm = ChatOpenAI(model="${modelName}", temperature=0)
    
    system_prompt = """${systemPromptStr}
    
Available workers: ${workerAgents.join(", ")}

Based on the current state and user request, decide which worker should act next.
Return your decision as a Command object with 'goto' (next worker or FINISH) and 'update' (state updates).
"""
    
    def supervisor_node(state):
        """Supervisor routing logic."""
        messages = state.get("messages", [])
        iteration = state.get("iteration", 0)
        
        # Check iteration limit
        if iteration >= ${maxIterations}:
            return Command(goto="FINISH", update={"iteration": iteration + 1})
        
        # Get LLM routing decision
        response = llm.with_structured_output(SupervisorCommand).invoke([
            {"role": "system", "content": system_prompt},
            *messages
        ])
        
        return Command(
            goto=response.goto,
            update={
                **response.update,
                "iteration": iteration + 1,
                "routing_history": state.get("routing_history", []) + [response.goto]
            }
        )
    
    return supervisor_node

# Usage:
# supervisor = create_supervisor()
# result = supervisor(state)
`;
}

export function generateWorkerCode(workerName: string, tools: ToolConfigInput[]): string {
  const toolsStr = tools.map(t => `"${t.name}"`).join(", ");
  const toolDefinitions = tools.map(t => `
def ${t.name}(${Object.keys(t.parameters).join(", ")}):
    """${t.description}"""
    # TODO: Implement ${t.name}
    pass
`).join("\n");
  
  return `from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langgraph.types import Command

# Worker Agent: ${workerName}

${toolDefinitions}

def create_${workerName}_agent():
    """Create ${workerName} worker agent with tools."""
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    # Define tools
    tools = [
        ${tools.map(t => `Tool(
            name="${t.name}",
            func=${t.name},
            description="${t.description}"
        )`).join(",\n        ")}
    ]
    
    # Bind tools to LLM
    llm_with_tools = llm.bind_tools(tools)
    
    def ${workerName}_node(state):
        """${workerName} agent execution."""
        messages = state.get("messages", [])
        
        # Execute with tools
        response = llm_with_tools.invoke(messages)
        
        # Return command to supervisor
        return Command(
            goto="supervisor",
            update={
                "messages": [response],
                "worker_results": {
                    **state.get("worker_results", {}),
                    "${workerName}": response.content
                }
            }
        )
    
    return ${workerName}_node

# Usage:
# ${workerName} = create_${workerName}_agent()
# result = ${workerName}(state)
`;
}

export function generateStateCode(config: AgentConfigInput): string {
  const { workerAgents = [] } = config;
  
  return `from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
from operator import add

# State Schema for ${config.name}

class AgentState(TypedDict):
    """State schema with reducers for concurrent updates."""
    
    # Messages with automatic merging
    messages: Annotated[list, add_messages]
    
    # Worker results dictionary
    worker_results: dict
    
    # Routing history
    routing_history: Annotated[list, add]
    
    # Iteration counter
    iteration: int
    
    # Error tracking
    errors: Annotated[list, add]

# Initial state
def create_initial_state(user_input: str) -> AgentState:
    """Create initial state for workflow."""
    return {
        "messages": [{"role": "user", "content": user_input}],
        "worker_results": {},
        "routing_history": [],
        "iteration": 0,
        "errors": []
    }
`;
}

export function generateWorkflowCode(config: AgentConfigInput): string {
  const { name, workerAgents = [], securityEnabled, checkpointingEnabled } = config;
  
  const workerNodes = workerAgents.map(w => `    workflow.add_node("${w}", create_${w}_agent())`).join("\n");
  const workerEdges = workerAgents.map(w => `    workflow.add_edge("${w}", "supervisor")`).join("\n");
  
  return `from langgraph.graph import StateGraph, START, END
${checkpointingEnabled ? 'from langgraph.checkpoint.postgres import PostgresSaver' : ''}
${securityEnabled ? 'from security_layer import SecurityLayer' : ''}

# Complete Workflow: ${name}

def create_workflow():
    """Build complete LangGraph workflow."""
    
    # Create state graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("supervisor", create_supervisor())
${workerNodes}
    
    # Add edges
    workflow.add_edge(START, "supervisor")
${workerEdges}
    
    # Conditional routing from supervisor
    workflow.add_conditional_edges(
        "supervisor",
        lambda state: state.get("routing_history", [])[-1] if state.get("routing_history") else "FINISH",
        {
            ${workerAgents.map(w => `"${w}": "${w}"`).join(",\n            ")},
            "FINISH": END
        }
    )
    
    ${checkpointingEnabled ? `
    # Add checkpointing
    checkpointer = PostgresSaver.from_conn_string(
        conn_string="postgresql://user:pass@localhost/db"
    )
    app = workflow.compile(checkpointer=checkpointer)
    ` : `
    # Compile without checkpointing
    app = workflow.compile()
    `}
    
    return app

# Usage:
# app = create_workflow()
# result = await app.ainvoke(
#     create_initial_state("Analyze AAPL stock"),
#     config={"configurable": {"thread_id": "session_001"}}
# )
`;
}

export function generateCompleteCode(config: AgentConfigInput): string {
  const { workerAgents = [], tools = [] } = config;
  
  let code = `"""
${config.name}
${config.description || "LangGraph agent configuration"}

Generated by LangGraph Agent Builder
"""

`;
  
  // Add state management
  code += generateStateCode(config) + "\n\n";
  
  // Add supervisor
  code += generateSupervisorCode(config) + "\n\n";
  
  // Add workers
  workerAgents.forEach(worker => {
    const workerTools = tools.filter(t => true); // All tools for now
    code += generateWorkerCode(worker, workerTools) + "\n\n";
  });
  
  // Add workflow
  code += generateWorkflowCode(config) + "\n\n";
  
  // Add main execution
  code += `
# Main execution
if __name__ == "__main__":
    import asyncio
    
    async def main():
        app = create_workflow()
        
        result = await app.ainvoke(
            create_initial_state("Your task here"),
            config={"configurable": {"thread_id": "session_001"}}
        )
        
        print("Final result:", result)
    
    asyncio.run(main())
`;
  
  return code;
}
