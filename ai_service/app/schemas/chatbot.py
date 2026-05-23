"""
Pydantic schemas for the AI Chatbot endpoint.

Defines request validation and the standardised response envelope
used by POST /api/ai/chatbot.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ChatMessage(BaseModel):
    """A single message in the conversation history."""

    role: str = Field(..., description="Author role: 'user' or 'assistant'")
    content: str = Field(..., description="Text content of the message")


class ChatRequest(BaseModel):
    """Input payload for the chatbot endpoint."""

    message: str = Field(..., min_length=1, description="User's current message")
    session_id: str = Field(default="default", description="Session identifier for Redis caching")
    history: List[ChatMessage] = Field(default=[], description="Prior conversation exchanges")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional user context metadata")


class ChatData(BaseModel):
    """Core chatbot response fields."""

    reply: str = Field(..., description="Generated assistant response")
    suggested_prompts: List[str] = Field(default=[], description="Suggested follow-up prompts")
    intent: str = Field(default="general", description="Detected user intent category")
    confidence: float = Field(default=0.0, description="Intent classification confidence")


class ChatResponse(BaseModel):
    """Standard envelope wrapping the chatbot result."""

    success: bool = True
    data: ChatData = Field(...)
    error: Optional[str] = None
