from pydantic import BaseModel
from typing import Optional

class SubmissionAnalysisRequest(BaseModel):
    task_file_id: str
    task_id: str
    organization_id: str
    file_url: str
    file_name: str
    file_type: str

class SubmissionAnalysisResponse(BaseModel):
    success: bool
    similarityScore: float
    mostSimilarTaskId: Optional[str] = None
    aiGeneratedProbability: float
    trustScore: int
    trustLevel: str
    extractedText: Optional[str] = None
    error: Optional[str] = None
