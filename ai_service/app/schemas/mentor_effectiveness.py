from pydantic import BaseModel
from typing import Optional

class MentorEffectivenessRequest(BaseModel):
    mentor_id: str
    intern_improvement_rate: float  # 0 to 100
    task_success_rate: float        # 0 to 100
    at_risk_recovery_rate: float    # 0 to 100
    avg_rating: float               # 0 to 5

class MentorEffectivenessResponse(BaseModel):
    success: bool
    effectivenessScore: float
    effectivenessGrade: str
    aiInsight: str
    error: Optional[str] = None
