"""
Portfolio Management Agent - Reference Implementation

Integrates technical and fundamental analysis for portfolio optimization.
"""

from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.types import Command
from langchain_core.messages import AIMessage

class PortfolioState(TypedDict):
    messages: Annotated[list, add_messages]
    portfolio_id: str
    holdings: list[dict]
    market_conditions: str | None
    rebalance_needed: bool | None
    recommendations: list[str]

def market_analysis_worker(state: PortfolioState) -> Command[Literal["supervisor"]]:
    conditions = "bullish"  # Mock
    analysis = f"Market Conditions: {conditions.upper()}"
    return Command(goto="supervisor", update={"market_conditions": conditions, "messages": [AIMessage(content=analysis)]})

def portfolio_analysis_worker(state: PortfolioState) -> Command[Literal["supervisor"]]:
    # Mock portfolio analysis
    total_value = sum(h.get("value", 0) for h in state["holdings"])
    analysis = f"Portfolio Value: ${total_value:,.2f}"
    return Command(goto="supervisor", update={"messages": [AIMessage(content=analysis)]})

def rebalance_worker(state: PortfolioState) -> Command[Literal["supervisor"]]:
    rebalance_needed = True  # Mock
    recommendations = ["Increase tech allocation by 5%", "Reduce bonds by 3%"]
    analysis = f"Rebalance: {'NEEDED' if rebalance_needed else 'NOT NEEDED'}\nRecommendations:\n" + "\n".join(f"- {r}" for r in recommendations)
    return Command(goto="supervisor", update={"rebalance_needed": rebalance_needed, "recommendations": recommendations, "messages": [AIMessage(content=analysis)]})

def supervisor(state: PortfolioState) -> Command[Literal["market_analysis", "portfolio_analysis", "rebalance", END]]:
    if state.get("market_conditions") is None:
        return Command(goto="market_analysis")
    elif len(state["messages"]) == 2:
        return Command(goto="portfolio_analysis")
    elif state.get("rebalance_needed") is None:
        return Command(goto="rebalance")
    return Command(goto=END)

def create_portfolio_agent():
    graph = StateGraph(PortfolioState)
    graph.add_node("supervisor", supervisor)
    graph.add_node("market_analysis", market_analysis_worker)
    graph.add_node("portfolio_analysis", portfolio_analysis_worker)
    graph.add_node("rebalance", rebalance_worker)
    graph.add_edge(START, "supervisor")
    return graph.compile()
