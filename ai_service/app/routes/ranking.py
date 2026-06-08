from fastapi import APIRouter, Query, HTTPException, Request
from typing import Optional, List, Dict, Any
import json
import hashlib
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
    payload: RankingRequest,
    request: Request,
    departmentId: Optional[str] = Query(None),
    period: str = Query("monthly", pattern="^(monthly|weekly)$")
):
    """
    Expects a list of intern metrics. In a real microservices architecture, 
    either the AI service queries the DB directly, or the backend sends the metrics.
    Here we expect the backend to send the raw metrics to be ranked.
    """
    redis_client = getattr(request.app.state, "redis", None)
    cache_key = None
    if redis_client:
        try:
            # Create a cache key by hashing the input payload + params
            input_data = {
                "interns": [intern.model_dump() for intern in payload.interns],
                "departmentId": departmentId,
                "period": period
            }
            input_str = json.dumps(input_data, sort_keys=True)
            cache_key = f"ranking_cache:{hashlib.sha256(input_str.encode('utf-8')).hexdigest()}"
            cached_res = redis_client.get(cache_key)
            if cached_res:
                return json.loads(cached_res)
        except Exception:
            pass

    try:
        interns_data = []
        for intern in payload.interns:
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
        
        if redis_client and cache_key:
            try:
                redis_client.set(cache_key, json.dumps(ranked_results), ex=600) # 10 minutes TTL
            except Exception:
                pass

        return ranked_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
