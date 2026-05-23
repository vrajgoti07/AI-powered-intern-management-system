"""
Route handler for the Recommendations endpoint.

POST /api/ai/recommendations — accepts intern profile data and
returns personalised task, skill, and training recommendations.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Request
from app.schemas.recommendation import RecommendRequest, RecommendResponse, RecommendData
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)
router = APIRouter()

_service = RecommendationService()


@router.post(
    "/recommendations",
    response_model=RecommendResponse,
    summary="Get personalised recommendations for an intern",
)
async def recommendations(payload: RecommendRequest, request: Request) -> RecommendResponse:
    """Generate tiered task, skill, and training recommendations."""
    logger.info("[%s] POST /api/ai/recommendations", datetime.utcnow().isoformat())

    try:
        redis_client = getattr(request.app.state, "redis", None)

        result = _service.get_recommendations(
            intern_id=payload.intern_id,
            skills=payload.skills,
            performance_score=payload.performance_score,
            department=payload.department,
            feedback_summary=payload.feedback_summary,
            redis_client=redis_client,
        )
        return RecommendResponse(
            success=True,
            data=RecommendData(**result),
            error=None,
        )
    except Exception as exc:
        logger.error("recommendations failed: %s", exc, exc_info=True)
        return RecommendResponse(
            success=False,
            data=RecommendData(
                reasoning="An error occurred while generating recommendations.",
            ),
            error=str(exc),
        )
