import pytest
from app.services.sentiment_service import SentimentService
from app.services.matching_service import MatchingService
from app.services.chatbot_service import ChatbotService
from app.services.performance_predictor import PerformancePredictor


def test_vader_sentiment_analysis():
    """Verify that VADER sentiment correctly classifies postive, negative, and neutral feedback."""
    service = SentimentService()
    
    # Test positive feedback
    pos_res = service.analyze_sentiment("This intern is extremely proactive and delivers outstanding results.")
    assert pos_res["sentiment"] == "POSITIVE"
    assert pos_res["confidence_score"] > 0.5
    assert len(pos_res["keywords"]) > 0
    assert "proactive" in pos_res["strong_skills"]

    # Test negative feedback
    neg_res = service.analyze_sentiment("The work is very slow, delayed, and unreliable.")
    assert neg_res["sentiment"] == "NEGATIVE"
    assert neg_res["confidence_score"] > 0.5
    assert "slow" in neg_res["weak_areas"]

    # Test empty feedback
    empty_res = service.analyze_sentiment("   ")
    assert empty_res["sentiment"] == "NEUTRAL"
    assert empty_res["confidence_score"] == 0.0


def test_matching_service_fallback():
    """Verify matching service falls back gracefully when models or API keys are missing."""
    service = MatchingService()
    
    # Trigger matching which will fallback due to OpenAI API key missing/unregistered or pickle mismatch
    result = service.match_role(
        skills=["python", "django", "postgres"],
        education="B.Tech in Computer Science",
        interests=["backend", "apis"],
        technologies=["git", "docker"]
    )
    
    assert "best_department" in result
    assert "match_percentage" in result
    assert "recommended_role" in result
    # Fallback should categorize Python/Docker into Engineering
    assert result["best_department"] == "Engineering"


def test_chatbot_lazy_classification():
    """Verify the chatbot trains its TF-IDF model lazily and outputs valid intent predictions."""
    service = ChatbotService()
    assert service._trained is False
    assert service._vectorizer is None
    
    # Query chatbot, triggering lazy training
    reply_res = service.get_reply("what is my current attendance score?")
    
    assert service._trained is True
    assert service._vectorizer is not None
    assert service._classifier is not None
    assert reply_res["intent"] == "my_attendance"
    assert reply_res["confidence"] > 0.2


def test_performance_predictor_native_importance():
    """Verify the performance predictor operates successfully without SHAP and outputs native drivers."""
    predictor = PerformancePredictor()
    
    # Check predicting with dummy model fallback (if xgboost_model.joblib is not present/trained)
    features = {
        "attendance_rate": 0.95,
        "task_completion_rate": 0.90,
        "avg_task_rating": 4.5,
        "days_since_last_task": 1,
        "communication_score": 0.85,
        "skill_match_score": 0.90,
        "week_number": 5
    }
    
    result = predictor.predict(features)
    assert "prediction" in result
    assert "confidence" in result
    assert "explanation" in result
    assert len(result["topFactors"]) > 0
    assert any(factor["factor"] == "attendance_rate" for factor in result["topFactors"])
