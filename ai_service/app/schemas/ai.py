from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Role Matching ---
class RoleMatchRequest(BaseModel):
    skills: List[str] = Field(..., description="List of intern's skills")
    interests: List[str] = Field(..., description="List of intern's interests")
    education: str = Field(..., description="Intern's educational background")
    department_requirements: List[Dict[str, Any]] = Field(
        ..., 
        description="List of department requirements containing dept/role details"
    )

class RoleMatchResponse(BaseModel):
    match_percentage: float = Field(..., description="Matching score out of 100")
    recommended_role: str = Field(..., description="Optimally suggested role")
    matched_skills: List[str] = Field(..., description="Skills matching requirements")
    missing_skills: List[str] = Field(..., description="Required skills that are missing")
    rationale: str = Field(..., description="Logical matching description explaining the output")


# --- Performance Prediction ---
class PerformancePredictRequest(BaseModel):
    attendance_rate: float = Field(..., ge=0.0, le=1.0, description="Intern daily attendance percentage (0 to 1)")
    task_completion_rate: float = Field(..., ge=0.0, le=1.0, description="Assigned task completion percentage (0 to 1)")
    feedback_sentiment_score: float = Field(..., ge=-1.0, le=1.0, description="Average feedback sentiment (-1 to 1)")
    productivity_score: float = Field(..., ge=0.0, le=1.0, description="Productivity factor/score (0 to 1)")

class PerformancePredictResponse(BaseModel):
    predicted_performance_grade: str = Field(..., description="Predicted letter grade: A, B, C, D, or F")
    predicted_score: float = Field(..., description="Calculated final rating out of 100")
    risk_level: str = Field(..., description="Risk assessment: LOW, MEDIUM, or HIGH")
    key_drivers: List[str] = Field(..., description="Key performance influences and factors")
    reconciliation_suggestions: List[str] = Field(..., description="Actionable improvement recommendations")


# --- Sentiment Analysis ---
class SentimentAnalysisRequest(BaseModel):
    feedback_text: str = Field(..., min_length=1, description="Raw feedback comments to evaluate")

class SentimentAnalysisResponse(BaseModel):
    sentiment_score: float = Field(..., description="Calculated polarity sentiment (-1.0 to 1.0)")
    label: str = Field(..., description="Sentiment category: POSITIVE, NEGATIVE, or NEUTRAL")
    positive_percentage: float = Field(..., description="Positive score percentage")
    negative_percentage: float = Field(..., description="Negative score percentage")
    extracted_suggestions: List[str] = Field(..., description="Key suggestions parsed from comments")


# --- Chatbot FAQ ---
class ChatbotMessage(BaseModel):
    role: str = Field(..., description="Role of the author: user or assistant")
    content: str = Field(..., description="Text content of the message")

class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Incoming user query")
    history: List[ChatbotMessage] = Field(default=[], description="Prior dialog exchanges")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional metadata (active tasks, roles, etc.)")

class ChatbotResponse(BaseModel):
    response: str = Field(..., description="Generated message response")
    suggested_actions: List[str] = Field(..., description="Suggested quick-reply actions")
    matched_faq: Optional[str] = Field(default=None, description="Title of the matched FAQ, if any")
