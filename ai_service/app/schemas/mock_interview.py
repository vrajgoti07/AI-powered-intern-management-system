from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class QuestionOut(BaseModel):
    questionText: str
    questionType: str

class StartInterviewRequest(BaseModel):
    job_role: str
    intern_name: str
    skills: List[str]

class StartInterviewResponse(BaseModel):
    success: bool
    questions: List[QuestionOut]
    error: Optional[str] = None

class EvaluateAnswerRequest(BaseModel):
    question_text: str
    question_type: str
    intern_answer: str

class EvaluateAnswerResponse(BaseModel):
    success: bool
    score: int
    aiFeedback: str
    error: Optional[str] = None

class QuestionWithAnswer(BaseModel):
    questionText: str
    questionType: str
    internAnswer: Optional[str] = None
    score: Optional[int] = None
    aiFeedback: Optional[str] = None

class GenerateSummaryRequest(BaseModel):
    job_role: str
    questions: List[QuestionWithAnswer]

class GenerateSummaryResponse(BaseModel):
    success: bool
    overallScore: float
    readinessLevel: str
    aiSummary: str
    error: Optional[str] = None
