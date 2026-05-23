"""
Route handler for the AI Chatbot endpoint.

POST /api/ai/chatbot — accepts a user message and returns an
intent-classified response with suggested follow-up prompts.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Request
from app.schemas.chatbot import ChatRequest, ChatResponse, ChatData
from app.services.chatbot_service import ChatbotService

logger = logging.getLogger(__name__)
router = APIRouter()

_service = ChatbotService()


@router.post(
    "/chatbot",
    response_model=ChatResponse,
    summary="Get an AI chatbot response with intent classification",
)
async def chatbot(payload: ChatRequest, request: Request) -> ChatResponse:
    """Process a user message and return a contextual AI response."""
    logger.info("[%s] POST /api/ai/chatbot", datetime.utcnow().isoformat())

    try:
        # Pass Redis client from app state if available
        redis_client = getattr(request.app.state, "redis", None)

        result = _service.get_reply(
            message=payload.message,
            session_id=payload.session_id,
            history=[msg.model_dump() for msg in payload.history] if payload.history else [],
            context=payload.context,
            redis_client=redis_client,
        )
        return ChatResponse(
            success=True,
            data=ChatData(**result),
            error=None,
        )
    except Exception as exc:
        logger.error("chatbot failed: %s", exc, exc_info=True)
        return ChatResponse(
            success=False,
            data=ChatData(
                reply="Sorry, I encountered an error. Please try again.",
            ),
            error=str(exc),
        )
