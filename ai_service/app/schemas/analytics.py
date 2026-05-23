"""
Pydantic schemas for the Analytics endpoint.

Defines the standardised response envelope used by
GET /api/ai/analytics.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class AnalyticsData(BaseModel):
    """Core analytics result fields."""

    productivity_trend: Dict[str, Any] = Field(default={}, description="Productivity metrics over time")
    risk_distribution: Dict[str, int] = Field(default={}, description="Count of interns per risk level")
    skill_gap_analysis: List[Dict[str, Any]] = Field(default=[], description="Skills gap insights")
    top_performers: List[Dict[str, Any]] = Field(default=[], description="Highest-performing interns")
    department_performance: Dict[str, Any] = Field(default={}, description="Performance stats per department")
    ai_insights: List[str] = Field(default=[], description="AI-generated insight strings")
    total_interns_analysed: int = Field(default=0, description="Total number of interns in the dataset")


class AnalyticsResponse(BaseModel):
    """Standard envelope wrapping the analytics result."""

    success: bool = True
    data: AnalyticsData = Field(...)
    error: Optional[str] = None
