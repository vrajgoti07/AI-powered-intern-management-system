from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import json
import hashlib

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
async def predict_performance(predict_req: PredictRequest, request: Request):
    redis_client = getattr(request.app.state, "redis", None)
    cache_key = None
    if redis_client:
        try:
            features_dict = predict_req.features.model_dump()
            # Build stable deterministic string representation
            feat_str = ",".join(f"{k}:{features_dict[k]}" for k in sorted(features_dict.keys()))
            key_str = f"perf:{predict_req.internId}:{feat_str}"
            cache_key = f"perf_cache:{hashlib.sha256(key_str.encode('utf-8')).hexdigest()}"
            
            cached_res = redis_client.get(cache_key)
            if cached_res:
                return json.loads(cached_res)
        except Exception:
            pass

    try:
        features_dict = predict_req.features.model_dump()
        result = predictor_instance.predict(features_dict)
        
        if redis_client and cache_key:
            try:
                redis_client.set(cache_key, json.dumps(result), ex=600)
            except Exception:
                pass
                
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feature-importance")
async def get_feature_importance():
    if not os.path.exists(FEATURE_IMPORTANCE_PATH):
        raise HTTPException(status_code=404, detail="Feature importance plot not found. Train the model first.")
    return FileResponse(FEATURE_IMPORTANCE_PATH, media_type="image/png")
