"""
Pydantic schemas for the Performance Prediction endpoint.

Defines request validation and the standardised response envelope
used by POST /api/ai/predict-performance.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any


class PredictionRequest(BaseModel):
    """Input payload for intern performance prediction."""

    attendance_rate: float = Field(..., ge=0.0, le=1.0, description="Daily attendance rate (0.0 to 1.0)")
    task_completion_rate: float = Field(..., ge=0.0, le=1.0, description="Task completion rate (0.0 to 1.0)")
    feedback_score: float = Field(..., ge=0.0, le=5.0, description="Average mentor feedback score (0-5)")
    productivity_score: float = Field(..., ge=0.0, le=1.0, description="Productivity metric (0.0 to 1.0)")
    submission_rate: float = Field(..., ge=0.0, le=1.0, description="On-time submission rate (0.0 to 1.0)")


class PredictionData(BaseModel):
    """Core prediction result fields."""

    predicted_performance_score: str = Field(..., description="Predicted performance label (Low/Medium/High)")
    productivity_level: str = Field(..., description="Productivity classification")
    risk_level: str = Field(..., description="Risk assessment: At Risk / Stable / Excellent")
    internship_success_probability: float = Field(..., description="Success probability (0.0 to 1.0)")
    key_drivers: list = Field(default=[], description="Key factors influencing the prediction")
    recommendations: list = Field(default=[], description="Actionable improvement suggestions")


class PredictionResponse(BaseModel):
    """Standard envelope wrapping the prediction result."""

    success: bool = True
    data: PredictionData = Field(...)
    error: Optional[str] = None
