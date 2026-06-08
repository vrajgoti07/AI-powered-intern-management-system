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
        redis_client = getattr(request.app.state, "redis", None)
        cache_key = None
        if redis_client:
            try:
                # Normalize values to build deterministic cache key
                skills_str = ",".join(sorted([s.lower().strip() for s in (payload.skills or [])]))
                techs_str = ",".join(sorted([t.lower().strip() for t in (payload.technologies or [])]))
                interests_str = ",".join(sorted([i.lower().strip() for i in (payload.interests or [])]))
                edu_str = (payload.education or "").strip().lower()
                key_str = f"match:{skills_str}:{edu_str}:{interests_str}:{techs_str}"
                import hashlib
                cache_key = f"match_cache:{hashlib.sha256(key_str.encode('utf-8')).hexdigest()}"
                
                cached_res = redis_client.get(cache_key)
                if cached_res:
                    import json
                    return MatchResponse(
                        success=True,
                        data=MatchData(**json.loads(cached_res)),
                        error=None,
                    )
            except Exception:
                pass

        result = _service.match_role(
            skills=payload.skills,
            education=payload.education,
            interests=payload.interests,
            technologies=payload.technologies,
        )

        if redis_client and cache_key:
            try:
                import json
                redis_client.set(cache_key, json.dumps(result), ex=1800)
            except Exception:
                pass

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
