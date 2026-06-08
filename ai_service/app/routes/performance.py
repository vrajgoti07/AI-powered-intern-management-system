from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import json
import hashlib

from app.services.performance_predictor import predictor_instance, FEATURE_IMPORTANCE_PATH
from app.services.prediction_service import PredictionService
from app.services.performance_service import PerformanceService
from app.schemas.prediction import PredictionResponse, PredictionData
from app.schemas.ai import PerformancePredictRequest

router = APIRouter()

# Instantiate the other two services
_prediction_service = PredictionService()
_performance_service = PerformanceService()

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
async def predict_performance(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 1. XGBoost Payload (internId + features) -> ai.service.ts
    if "features" in body:
        redis_client = getattr(request.app.state, "redis", None)
        cache_key = None
        
        intern_id = body.get("internId", "unknown")
        features_dict = body.get("features", {})
        
        if redis_client:
            try:
                # Build stable deterministic string representation
                feat_str = ",".join(f"{k}:{features_dict.get(k)}" for k in sorted(features_dict.keys()))
                key_str = f"perf:{intern_id}:{feat_str}"
                cache_key = f"perf_cache:{hashlib.sha256(key_str.encode('utf-8')).hexdigest()}"
                
                cached_res = redis_client.get(cache_key)
                if cached_res:
                    return json.loads(cached_res)
            except Exception:
                pass

        try:
            # Fill default values if any features are missing to prevent runtime errors
            features = {
                "attendance_rate": float(features_dict.get("attendance_rate", 0.95)),
                "task_completion_rate": float(features_dict.get("task_completion_rate", 0.90)),
                "avg_task_rating": float(features_dict.get("avg_task_rating", 4.0)),
                "days_since_last_task": int(features_dict.get("days_since_last_task", 2)),
                "communication_score": float(features_dict.get("communication_score", 4.0)),
                "skill_match_score": float(features_dict.get("skill_match_score", 0.75)),
                "week_number": int(features_dict.get("week_number", 4))
            }
            result = predictor_instance.predict(features)
            
            if redis_client and cache_key:
                try:
                    redis_client.set(cache_key, json.dumps(result), ex=600)
                except Exception:
                    pass
                    
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # 2. Ridge Regression Payload -> report.service.ts
    elif "feedback_sentiment_score" in body:
        try:
            data = PerformancePredictRequest(
                attendance_rate=float(body.get("attendance_rate", 0.0)),
                task_completion_rate=float(body.get("task_completion_rate", 0.0)),
                feedback_sentiment_score=float(body.get("feedback_sentiment_score", 0.0)),
                productivity_score=float(body.get("productivity_score", 0.0))
            )
            return _performance_service.predict_performance(data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # 3. Random Forest Payload -> old/mock/default prediction.py schema
    else:
        try:
            attendance_rate = float(body.get("attendance_rate", 0.5))
            task_completion_rate = float(body.get("task_completion_rate", 0.5))
            feedback_score = float(body.get("feedback_score", 2.5))
            productivity_score = float(body.get("productivity_score", 0.5))
            submission_rate = float(body.get("submission_rate", 0.5))
            
            result = _prediction_service.predict_performance(
                attendance_rate=attendance_rate,
                task_completion_rate=task_completion_rate,
                feedback_score=feedback_score,
                productivity_score=productivity_score,
                submission_rate=submission_rate
            )
            return PredictionResponse(
                success=True,
                data=PredictionData(**result),
                error=None
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-importance")
async def get_feature_importance():
    if not os.path.exists(FEATURE_IMPORTANCE_PATH):
        raise HTTPException(status_code=404, detail="Feature importance plot not found. Train the model first.")
    return FileResponse(FEATURE_IMPORTANCE_PATH, media_type="image/png")
