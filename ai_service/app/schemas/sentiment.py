"""
Pydantic schemas for the Sentiment Analysis endpoint.

Defines request validation and the standardised response envelope
used by POST /api/ai/sentiment-analysis.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any


class SentimentRequest(BaseModel):
    """Input payload for mentor feedback sentiment analysis."""

    feedback_text: str = Field(..., min_length=1, description="Raw mentor feedback text to analyse")


class SentimentData(BaseModel):
    """Core sentiment analysis result fields."""

    sentiment: str = Field(..., description="Sentiment label: POSITIVE, NEGATIVE, or NEUTRAL")
    confidence_score: float = Field(..., description="Model confidence (0.0 to 1.0)")
    keywords: List[str] = Field(default=[], description="Key terms extracted from feedback")
    weak_areas: List[str] = Field(default=[], description="Identified areas needing improvement")
    strong_skills: List[str] = Field(default=[], description="Identified strengths")
    improvement_suggestions: List[str] = Field(default=[], description="Actionable suggestions")


class SentimentResponse(BaseModel):
    """Standard envelope wrapping the sentiment result."""

    success: bool = True
    data: SentimentData = Field(...)
    error: Optional[str] = None
