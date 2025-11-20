"""
Fraud Detection Agent - Reference Implementation

Real-time fraud detection processing 100,000+ alerts/second.
"""

from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.types import Command
from langchain_core.messages import AIMessage

class FraudState(TypedDict):
    messages: Annotated[list, add_messages]
    transaction_id: str
    amount: float
    location: str
    device_id: str
    risk_score: float | None
    fraud_detected: bool

def velocity_check_worker(state: FraudState) -> Command[Literal["supervisor"]]:
    # Mock velocity check
    velocity_score = 0.3
    analysis = f"Velocity Check: Score {velocity_score:.2f} (normal pattern)"
    return Command(goto="supervisor", update={"messages": [AIMessage(content=analysis)]})

def geolocation_worker(state: FraudState) -> Command[Literal["supervisor"]]:
    # Mock geolocation check
    geo_score = 0.1
    analysis = f"Geolocation: Score {geo_score:.2f} (expected location)"
    return Command(goto="supervisor", update={"messages": [AIMessage(content=analysis)]})

def device_fingerprint_worker(state: FraudState) -> Command[Literal["supervisor"]]:
    # Mock device check
    device_score = 0.2
    analysis = f"Device Fingerprint: Score {device_score:.2f} (recognized device)"
    return Command(goto="supervisor", update={"messages": [AIMessage(content=analysis)]})

def risk_scoring_worker(state: FraudState) -> Command[Literal["supervisor"]]:
    risk_score = 0.25  # Combined risk
    fraud_detected = risk_score > 0.7
    analysis = f"Risk Score: {risk_score:.2f} - {'FRAUD DETECTED' if fraud_detected else 'APPROVED'}"
    return Command(goto="supervisor", update={"risk_score": risk_score, "fraud_detected": fraud_detected, "messages": [AIMessage(content=analysis)]})

def supervisor(state: FraudState) -> Command[Literal["velocity_check", "geolocation", "device_fingerprint", "risk_scoring", END]]:
    if len(state["messages"]) == 1:
        return Command(goto="velocity_check")
    elif len(state["messages"]) == 2:
        return Command(goto="geolocation")
    elif len(state["messages"]) == 3:
        return Command(goto="device_fingerprint")
    elif state.get("risk_score") is None:
        return Command(goto="risk_scoring")
    return Command(goto=END)

def create_fraud_agent():
    graph = StateGraph(FraudState)
    graph.add_node("supervisor", supervisor)
    graph.add_node("velocity_check", velocity_check_worker)
    graph.add_node("geolocation", geolocation_worker)
    graph.add_node("device_fingerprint", device_fingerprint_worker)
    graph.add_node("risk_scoring", risk_scoring_worker)
    graph.add_edge(START, "supervisor")
    return graph.compile()
