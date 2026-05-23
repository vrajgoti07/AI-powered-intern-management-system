from fastapi import APIRouter, HTTPException, status
from app.schemas.ai import (
    RoleMatchRequest, RoleMatchResponse,
    PerformancePredictRequest, PerformancePredictResponse,
    SentimentAnalysisRequest, SentimentAnalysisResponse,
    ChatbotRequest, ChatbotResponse
)
from app.services.role_matching_service import RoleMatchingService
from app.services.performance_service import PerformanceService
from app.services.sentiment_service import SentimentService
from app.services.chatbot_service import ChatbotService

router = APIRouter()

# Instantiate AI services once at application boot
role_matching_service = RoleMatchingService()
performance_service = PerformanceService()
sentiment_service = SentimentService()
chatbot_service = ChatbotService()

@router.post(
    "/match-role", 
    response_model=RoleMatchResponse, 
    status_code=status.HTTP_200_OK,
    summary="Match intern profile to departmental/role requirements"
)
async def match_role(payload: RoleMatchRequest):
    try:
        return role_matching_service.match_role(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing role matching analysis: {str(e)}"
        )

@router.post(
    "/predict-performance", 
    response_model=PerformancePredictResponse, 
    status_code=status.HTTP_200_OK,
    summary="Predict intern rating grade and identify key performance drivers"
)
async def predict_performance(payload: PerformancePredictRequest):
    try:
        return performance_service.predict_performance(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing performance prediction model: {str(e)}"
        )

@router.post(
    "/sentiment-analysis", 
    response_model=SentimentAnalysisResponse, 
    status_code=status.HTTP_200_OK,
    summary="Analyze feedback sentiment and extract constructive suggestions"
)
async def sentiment_analysis(payload: SentimentAnalysisRequest):
    try:
        return sentiment_service.analyze_sentiment(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing feedback sentiment analysis: {str(e)}"
        )

@router.post(
    "/chatbot", 
    response_model=ChatbotResponse, 
    status_code=status.HTTP_200_OK,
    summary="Get semantic FAQ answers and context-aware recommendations"
)
async def chatbot(payload: ChatbotRequest):
    try:
        return chatbot_service.get_response(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chatbot dialog sequence: {str(e)}"
        )
