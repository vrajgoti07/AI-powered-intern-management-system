from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SkillRequirementIn(BaseModel):
    skillName: str
    requiredLevel: str  # "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    category: str       # "Technical" | "Soft Skills" | "Tools"

class SkillGapRequest(BaseModel):
    intern_id: str
    department_id: str
    intern_skills: List[str]
    required_skills: List[SkillRequirementIn]

class SkillGapResponse(BaseModel):
    success: bool
    matchPercentage: float
    analysisData: List[Dict[str, Any]]      # list of { "skill": str, "internScore": int, "requiredScore": int }
    recommendations: List[Dict[str, Any]]   # list of { "skill": str, "level": str, "resources": list }
    error: Optional[str] = None
