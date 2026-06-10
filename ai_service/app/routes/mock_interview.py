import logging
from datetime import datetime
from fastapi import APIRouter, Request, status, HTTPException
from app.schemas.mock_interview import (
    StartInterviewRequest, StartInterviewResponse, QuestionOut,
    EvaluateAnswerRequest, EvaluateAnswerResponse,
    GenerateSummaryRequest, GenerateSummaryResponse
)
from app.services.mock_interview_service import mock_interview_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post(
    "/mock-interview/start",
    response_model=StartInterviewResponse,
    summary="Generate mock interview questions based on job role and skills",
)
async def start_interview(payload: StartInterviewRequest, request: Request) -> StartInterviewResponse:
    """Generate 5 tailored questions for the mock interview."""
    logger.info("[%s] POST /api/ai/mock-interview/start", datetime.utcnow().isoformat())
    try:
        questions = mock_interview_service.generate_questions(
            job_role=payload.job_role,
            intern_name=payload.intern_name,
            skills=payload.skills
        )
        return StartInterviewResponse(
            success=True,
            questions=[QuestionOut(**q) for q in questions],
            error=None
        )
    except Exception as exc:
        logger.error("start_interview failed: %s", exc, exc_info=True)
        return StartInterviewResponse(
            success=False,
            questions=[],
            error=str(exc)
        )

@router.post(
    "/mock-interview/evaluate-answer",
    response_model=EvaluateAnswerResponse,
    summary="Evaluate an answer to a single question",
)
async def evaluate_answer(payload: EvaluateAnswerRequest, request: Request) -> EvaluateAnswerResponse:
    """Evaluate and grade the intern's answer to a single question."""
    logger.info("[%s] POST /api/ai/mock-interview/evaluate-answer", datetime.utcnow().isoformat())
    try:
        result = mock_interview_service.evaluate_answer(
            question_text=payload.question_text,
            question_type=payload.question_type,
            intern_answer=payload.intern_answer
        )
        return EvaluateAnswerResponse(
            success=True,
            score=result["score"],
            aiFeedback=result["aiFeedback"],
            error=None
        )
    except Exception as exc:
        logger.error("evaluate_answer failed: %s", exc, exc_info=True)
        return EvaluateAnswerResponse(
            success=False,
            score=0,
            aiFeedback="Failed to process evaluation.",
            error=str(exc)
        )

@router.post(
    "/mock-interview/generate-summary",
    response_model=GenerateSummaryResponse,
    summary="Generate overall mock interview readiness summary",
)
async def generate_summary(payload: GenerateSummaryRequest, request: Request) -> GenerateSummaryResponse:
    """Compile overall score, readiness level, and AI synthesis review."""
    logger.info("[%s] POST /api/ai/mock-interview/generate-summary", datetime.utcnow().isoformat())
    try:
        # Map Pydantic models back to dictionaries
        questions_dicts = [q.model_dump() for q in payload.questions]
        result = mock_interview_service.generate_summary(
            job_role=payload.job_role,
            questions=questions_dicts
        )
        return GenerateSummaryResponse(
            success=True,
            overallScore=result["overallScore"],
            readinessLevel=result["readinessLevel"],
            aiSummary=result["aiSummary"],
            error=None
        )
    except Exception as exc:
        logger.error("generate_summary failed: %s", exc, exc_info=True)
        return GenerateSummaryResponse(
            success=False,
            overallScore=0.0,
            readinessLevel="NEEDS_PRACTICE",
            aiSummary="Failed to compile evaluation summary.",
            error=str(exc)
        )
