"""
Pydantic schemas for the Recommendations endpoint.

Defines request validation and the standardised response envelope
used by POST /api/ai/recommendations.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any


class RecommendRequest(BaseModel):
    """Input payload for personalised intern recommendations."""

    intern_id: str = Field(..., description="Unique identifier for the intern")
    skills: List[str] = Field(default=[], description="Current skill set")
    performance_score: float = Field(default=0.5, ge=0.0, le=1.0, description="Current performance score (0-1)")
    department: str = Field(default="General", description="Assigned department")
    feedback_summary: str = Field(default="", description="Summary of recent mentor feedback")


class RecommendData(BaseModel):
    """Core recommendation result fields."""

    recommended_tasks: List[str] = Field(default=[], description="Tasks suited to the intern's level")
    skills_to_learn: List[str] = Field(default=[], description="Skills to develop next")
    recommended_departments: List[str] = Field(default=[], description="Departments to explore")
    training_resources: List[str] = Field(default=[], description="Courses, articles, or tutorials")
    reasoning: str = Field(default="", description="Explanation of why these recommendations were generated")


class RecommendResponse(BaseModel):
    """Standard envelope wrapping the recommendation result."""

    success: bool = True
    data: RecommendData = Field(...)
    error: Optional[str] = None
