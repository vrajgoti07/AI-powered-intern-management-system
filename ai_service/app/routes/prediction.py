"""
Route handler for the Performance Prediction endpoint.

POST /api/ai/predict-performance — accepts intern metrics and
returns a performance prediction with risk assessment.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Request
from app.schemas.prediction import PredictionRequest, PredictionResponse, PredictionData
from app.services.prediction_service import PredictionService

logger = logging.getLogger(__name__)
router = APIRouter()

_service = PredictionService()


@router.post(
    "/predict-performance",
    response_model=PredictionResponse,
    summary="Predict intern performance level and risk assessment",
)
async def predict_performance(payload: PredictionRequest, request: Request) -> PredictionResponse:
    """Predict performance from attendance, completion, feedback, productivity, and submission metrics."""
    logger.info("[%s] POST /api/ai/predict-performance", datetime.utcnow().isoformat())

    try:
        result = _service.predict_performance(
            attendance_rate=payload.attendance_rate,
            task_completion_rate=payload.task_completion_rate,
            feedback_score=payload.feedback_score,
            productivity_score=payload.productivity_score,
            submission_rate=payload.submission_rate,
        )
        return PredictionResponse(
            success=True,
            data=PredictionData(**result),
            error=None,
        )
    except Exception as exc:
        logger.error("predict-performance failed: %s", exc, exc_info=True)
        return PredictionResponse(
            success=False,
            data=PredictionData(
                predicted_performance_score="Unknown",
                productivity_level="Unknown",
                risk_level="Unknown",
                internship_success_probability=0.0,
            ),
            error=str(exc),
        )
