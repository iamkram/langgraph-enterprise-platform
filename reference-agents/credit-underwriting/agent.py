"""
Credit Underwriting Agent - Reference Implementation

Policy-based credit decision engine with automated underwriting.
"""

from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.types import Command
from langchain_core.messages import AIMessage

class CreditState(TypedDict):
    messages: Annotated[list, add_messages]
    applicant_id: str
    credit_score: int
    income: float
    debt: float
    employment_years: int
    decision: str | None

def credit_score_worker(state: CreditState) -> Command[Literal["supervisor"]]:
    score = state["credit_score"]
    tier = "excellent" if score >= 750 else "good" if score >= 700 else "fair" if score >= 650 else "poor"
    analysis = f"Credit Score: {score} ({tier.upper()})"
    return Command(goto="supervisor", update={"messages": [AIMessage(content=analysis)]})

def dti_worker(state: CreditState) -> Command[Literal["supervisor"]]:
    dti = (state["debt"] / state["income"]) * 100 if state["income"] > 0 else 100
    status = "acceptable" if dti < 36 else "borderline" if dti < 43 else "high"
    analysis = f"Debt-to-Income: {dti:.1f}% ({status.upper()})"
    return Command(goto="supervisor", update={"messages": [AIMessage(content=analysis)]})

def decision_worker(state: CreditState) -> Command[Literal["supervisor"]]:
    score = state["credit_score"]
    dti = (state["debt"] / state["income"]) * 100 if state["income"] > 0 else 100
    
    if score >= 700 and dti < 36:
        decision = "APPROVED"
    elif score >= 650 and dti < 43:
        decision = "APPROVED_WITH_CONDITIONS"
    else:
        decision = "DENIED"
    
    return Command(goto="supervisor", update={"decision": decision, "messages": [AIMessage(content=f"Decision: {decision}")]})

def supervisor(state: CreditState) -> Command[Literal["credit_score", "dti", "decision", END]]:
    if len(state["messages"]) == 1:
        return Command(goto="credit_score")
    elif len(state["messages"]) == 2:
        return Command(goto="dti")
    elif state.get("decision") is None:
        return Command(goto="decision")
    return Command(goto=END)

def create_credit_agent():
    graph = StateGraph(CreditState)
    graph.add_node("supervisor", supervisor)
    graph.add_node("credit_score", credit_score_worker)
    graph.add_node("dti", dti_worker)
    graph.add_node("decision", decision_worker)
    graph.add_edge(START, "supervisor")
    return graph.compile()
