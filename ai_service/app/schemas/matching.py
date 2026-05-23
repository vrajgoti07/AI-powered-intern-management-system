"""
Pydantic schemas for the Role Matching endpoint.

Defines request validation and the standardised response envelope
used by POST /api/ai/match-role.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any


class MatchRequest(BaseModel):
    """Input payload for intern-to-department role matching."""

    skills: List[str] = Field(..., description="List of the intern's technical and soft skills")
    education: str = Field(..., description="Intern's educational background or degree")
    interests: List[str] = Field(default=[], description="Intern's career interests")
    technologies: List[str] = Field(default=[], description="Technologies the intern has experience with")


class MatchData(BaseModel):
    """Core matching result fields."""

    match_percentage: float = Field(..., description="Similarity score as a percentage (0-100)")
    best_department: str = Field(..., description="Best-matched department name")
    recommended_role: str = Field(..., description="Suggested role within the department")
    suggested_technologies: List[str] = Field(default=[], description="Technologies to focus on")
    matched_skills: List[str] = Field(default=[], description="Skills that matched the department profile")
    missing_skills: List[str] = Field(default=[], description="Skills the intern should develop")
    rationale: str = Field(default="", description="Human-readable matching explanation")


class MatchResponse(BaseModel):
    """Standard envelope wrapping the match result."""

    success: bool = True
    data: MatchData = Field(...)
    error: Optional[str] = None
