"""
Route handler for the Analytics endpoint.

GET /api/ai/analytics — returns aggregate performance analytics
with optional department and date_range filters.
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Request, Query
from app.schemas.analytics import AnalyticsResponse, AnalyticsData
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)
router = APIRouter()

_service = AnalyticsService()


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Get aggregate performance analytics and AI insights",
)
async def analytics(
    request: Request,
    department: Optional[str] = Query(None, description="Filter by department name"),
    date_range: Optional[str] = Query(None, description="Date range filter (reserved)"),
) -> AnalyticsResponse:
    """Compute and return comprehensive intern performance analytics."""
    logger.info("[%s] GET /api/ai/analytics (dept=%s)", datetime.utcnow().isoformat(), department)

    try:
        redis_client = getattr(request.app.state, "redis", None)

        result = _service.get_analytics(
            department=department,
            date_range=date_range,
            redis_client=redis_client,
        )
        return AnalyticsResponse(
            success=True,
            data=AnalyticsData(**result),
            error=None,
        )
    except Exception as exc:
        logger.error("analytics failed: %s", exc, exc_info=True)
        return AnalyticsResponse(
            success=False,
            data=AnalyticsData(
                ai_insights=["Analytics computation failed."],
            ),
            error=str(exc),
        )
