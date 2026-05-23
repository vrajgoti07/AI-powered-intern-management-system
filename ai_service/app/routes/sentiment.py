"""
Route handler for the Sentiment Analysis endpoint.

POST /api/ai/sentiment-analysis — accepts feedback text and returns
sentiment classification with keywords, strengths, and suggestions.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Request
from app.schemas.sentiment import SentimentRequest, SentimentResponse, SentimentData
from app.services.sentiment_service import SentimentService

logger = logging.getLogger(__name__)
router = APIRouter()

_service = SentimentService()


@router.post(
    "/sentiment-analysis",
    response_model=SentimentResponse,
    summary="Analyse mentor feedback sentiment and extract insights",
)
async def sentiment_analysis(payload: SentimentRequest, request: Request) -> SentimentResponse:
    """Analyse the sentiment of a mentor's feedback text."""
    logger.info("[%s] POST /api/ai/sentiment-analysis", datetime.utcnow().isoformat())

    try:
        result = _service.analyze_sentiment(feedback_text=payload.feedback_text)
        return SentimentResponse(
            success=True,
            data=SentimentData(**result),
            error=None,
        )
    except Exception as exc:
        logger.error("sentiment-analysis failed: %s", exc, exc_info=True)
        return SentimentResponse(
            success=False,
            data=SentimentData(
                sentiment="NEUTRAL",
                confidence_score=0.0,
            ),
            error=str(exc),
        )
