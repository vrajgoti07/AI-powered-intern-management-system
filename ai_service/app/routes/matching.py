"""
Route handler for the Role Matching endpoint.

POST /api/ai/match-role — accepts an intern profile and returns
the best department match with confidence score and rationale.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Request
from app.schemas.matching import MatchRequest, MatchResponse, MatchData
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)
router = APIRouter()

# Instantiate service once at module level
_service = MatchingService()


@router.post(
    "/match-role",
    response_model=MatchResponse,
    summary="Match intern profile to the best department and role",
)
async def match_role(payload: MatchRequest, request: Request) -> MatchResponse:
    """Match an intern's skills, education, and interests to a department."""
    logger.info("[%s] POST /api/ai/match-role", datetime.utcnow().isoformat())

    try:
        result = _service.match_role(
            skills=payload.skills,
            education=payload.education,
            interests=payload.interests,
            technologies=payload.technologies,
        )
        return MatchResponse(
            success=True,
            data=MatchData(**result),
            error=None,
        )
    except Exception as exc:
        logger.error("match-role failed: %s", exc, exc_info=True)
        return MatchResponse(
            success=False,
            data=MatchData(
                match_percentage=0.0,
                best_department="Unknown",
                recommended_role="Unknown",
            ),
            error=str(exc),
        )
