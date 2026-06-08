from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.services.risk_detector import RiskDetectorService

router = APIRouter()

class RiskMetrics(BaseModel):
    internId: str
    name: str
    attendance: float
    days_since_last_task: int
    overdue_high_priority_tasks: int
    workload_score: float
    days_since_mentor_interaction: int

class RiskRequest(BaseModel):
    interns: List[RiskMetrics]

@router.post("/risks/evaluate")
async def evaluate_risks(request: RiskRequest):
    """
    Evaluates risks for a given list of interns.
    """
    try:
        interns_data = [intern.model_dump() for intern in request.interns]
        detected_risks = RiskDetectorService.detect_risks(interns_data)
        return detected_risks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risks")
async def get_risks(departmentId: Optional[str] = Query(None)):
    """
    In a fully integrated flow, this would fetch pre-calculated risks from the DB.
    For this implementation, we return a mocked response since the AI service 
    operates functionally via the POST endpoint.
    """
    return [
        {
            "internId": "mock-123",
            "name": "Jane Doe",
            "riskLevel": "medium",
            "riskType": ["Disengagement"],
            "recommendedAction": "Reach out to the intern to discuss current roadblocks and re-engage.",
            "urgency": "this-week"
        }
    ]

@router.post("/trigger-risk-scan")
async def trigger_risk_scan():
    """
    Manually triggers the daily risk detection scan.
    """
    try:
        from app.services.risk_detector import run_daily_risk_detection
        run_daily_risk_detection()
        return {"status": "success", "message": "Manual risk detection scan completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
