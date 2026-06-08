from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.services.intern_ranking import InternRankingService

router = APIRouter()

class InternMetrics(BaseModel):
    internId: Optional[str] = None
    intern_id: Optional[str] = None
    name: str
    attendance: Optional[float] = None
    attendance_rate: Optional[float] = None
    task_completion: Optional[float] = None
    task_completion_rate: Optional[float] = None
    task_quality: Optional[float] = None
    avg_task_rating: Optional[float] = None
    communication: Optional[float] = None
    communication_score: Optional[float] = None
    skill_growth: Optional[float] = None
    skill_growth_score: Optional[float] = None
    previous_change: int = 0

class RankingRequest(BaseModel):
    interns: List[InternMetrics]


@router.post("/ranking")
async def get_ranking(
    request: RankingRequest,
    departmentId: Optional[str] = Query(None),
    period: str = Query("monthly", pattern="^(monthly|weekly)$")
):
    """
    Expects a list of intern metrics. In a real microservices architecture, 
    either the AI service queries the DB directly, or the backend sends the metrics.
    Here we expect the backend to send the raw metrics to be ranked.
    """
    try:
        interns_data = []
        for intern in request.interns:
            mapped = {
                "internId": intern.internId or intern.intern_id or "",
                "name": intern.name,
                "attendance": intern.attendance if intern.attendance is not None else (intern.attendance_rate or 0.0),
                "task_completion": intern.task_completion if intern.task_completion is not None else (intern.task_completion_rate or 0.0),
                "task_quality": intern.task_quality if intern.task_quality is not None else (intern.avg_task_rating or 0.0),
                "communication": intern.communication if intern.communication is not None else (intern.communication_score or 0.0),
                "skill_growth": intern.skill_growth if intern.skill_growth is not None else (intern.skill_growth_score or 0.0),
                "previous_change": intern.previous_change
            }
            interns_data.append(mapped)

        ranked_results = InternRankingService.calculate_ranking(interns_data)
        return ranked_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
