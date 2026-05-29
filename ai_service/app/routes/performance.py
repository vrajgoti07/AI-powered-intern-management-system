from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

from app.services.performance_predictor import predictor_instance, FEATURE_IMPORTANCE_PATH

router = APIRouter()

class FeaturesInput(BaseModel):
    attendance_rate: float
    task_completion_rate: float
    avg_task_rating: float
    days_since_last_task: int
    communication_score: float
    skill_match_score: float
    week_number: int

class PredictRequest(BaseModel):
    internId: str
    features: FeaturesInput

@router.post("/predict-performance")
async def predict_performance(request: PredictRequest):
    try:
        features_dict = request.features.model_dump()
        result = predictor_instance.predict(features_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feature-importance")
async def get_feature_importance():
    if not os.path.exists(FEATURE_IMPORTANCE_PATH):
        raise HTTPException(status_code=404, detail="Feature importance plot not found. Train the model first.")
    return FileResponse(FEATURE_IMPORTANCE_PATH, media_type="image/png")
