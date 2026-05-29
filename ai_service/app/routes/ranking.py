from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.services.intern_ranking import InternRankingService

router = APIRouter()

class InternMetrics(BaseModel):
    internId: str
    name: str
    attendance: float
    task_completion: float
    task_quality: float
    communication: float
    skill_growth: float
    previous_change: int = 0

class RankingRequest(BaseModel):
    interns: List[InternMetrics]

@router.post("/ranking")
async def get_ranking(
    request: RankingRequest,
    departmentId: Optional[str] = Query(None),
    period: str = Query("monthly", regex="^(monthly|weekly)$")
):
    """
    Expects a list of intern metrics. In a real microservices architecture, 
    either the AI service queries the DB directly, or the backend sends the metrics.
    Here we expect the backend to send the raw metrics to be ranked.
    """
    try:
        interns_data = [intern.model_dump() for intern in request.interns]
        ranked_results = InternRankingService.calculate_ranking(interns_data)
        return ranked_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
