from fastapi import APIRouter, HTTPException, status
import logging

from app.schemas.submission_analysis import SubmissionAnalysisRequest, SubmissionAnalysisResponse
from app.schemas.skill_gap import SkillGapRequest, SkillGapResponse
from app.schemas.mentor_effectiveness import MentorEffectivenessRequest, MentorEffectivenessResponse

from app.services.submission_analysis_service import submission_analysis_service
from app.services.skill_gap_service import skill_gap_service
from app.services.mentor_effectiveness_service import mentor_effectiveness_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/submission/analyze",
    response_model=SubmissionAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a task submission file for plagiarism and AI generated content"
)
async def analyze_submission(payload: SubmissionAnalysisRequest):
    try:
        result = submission_analysis_service.analyze_submission(
            task_file_id=payload.task_file_id,
            task_id=payload.task_id,
            organization_id=payload.organization_id,
            file_url=payload.file_url,
            file_name=payload.file_name,
            file_type=payload.file_type
        )
        return {
            "success": True,
            "similarityScore": result["similarityScore"],
            "mostSimilarTaskId": result["mostSimilarTaskId"],
            "aiGeneratedProbability": result["aiGeneratedProbability"],
            "trustScore": result["trustScore"],
            "trustLevel": result["trustLevel"],
            "extractedText": result["extractedText"]
        }
    except Exception as e:
        logger.error("Error in analyze_submission route: %s", e)
        return {
            "success": False,
            "similarityScore": 0.0,
            "mostSimilarTaskId": None,
            "aiGeneratedProbability": 0.0,
            "trustScore": 100,
            "trustLevel": "TRUSTED",
            "extractedText": None,
            "error": str(e)
        }

@router.post(
    "/skill-gap/analyze",
    response_model=SkillGapResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze intern skill gaps and generate personalized learning recommendations"
)
async def analyze_skill_gap(payload: SkillGapRequest):
    try:
        # Map required_skills objects to list of dicts for service consumption
        req_skills = [
            {
                "skillName": s.skillName,
                "requiredLevel": s.requiredLevel,
                "category": s.category
            }
            for s in payload.required_skills
        ]
        
        match_pct, analysis_data, gaps = skill_gap_service.calculate_skill_scores(
            intern_skills=payload.intern_skills,
            required_skills=req_skills
        )
        
        recs = skill_gap_service.generate_recommendations(gaps)
        
        return {
            "success": True,
            "matchPercentage": match_pct,
            "analysisData": analysis_data,
            "recommendations": recs
        }
    except Exception as e:
        logger.error("Error in analyze_skill_gap route: %s", e)
        return {
            "success": False,
            "matchPercentage": 0.0,
            "analysisData": [],
            "recommendations": [],
            "error": str(e)
        }

@router.post(
    "/mentor-effectiveness/calculate",
    response_model=MentorEffectivenessResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate mentor effectiveness index and compile coaching suggestions"
)
async def calculate_mentor_effectiveness(payload: MentorEffectivenessRequest):
    try:
        result = mentor_effectiveness_service.calculate_effectiveness(
            mentor_id=payload.mentor_id,
            intern_improvement_rate=payload.intern_improvement_rate,
            task_success_rate=payload.task_success_rate,
            at_risk_recovery_rate=payload.at_risk_recovery_rate,
            avg_rating=payload.avg_rating
        )
        return {
            "success": True,
            "effectivenessScore": result["effectivenessScore"],
            "effectivenessGrade": result["effectivenessGrade"],
            "aiInsight": result["aiInsight"]
        }
    except Exception as e:
        logger.error("Error in calculate_mentor_effectiveness route: %s", e)
        return {
            "success": False,
            "effectivenessScore": 0.0,
            "effectivenessGrade": "NEEDS_IMPROVEMENT",
            "aiInsight": f"Heuristics evaluation fallback due to error: {str(e)}",
            "error": str(e)
        }
