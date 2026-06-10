import logging
import json
from typing import Dict, Any
from app.config.settings import settings

logger = logging.getLogger(__name__)

class MentorEffectivenessService:
    def __init__(self) -> None:
        self._openai_client = None
        self._initialized = False

    def _init_openai(self) -> None:
        if self._initialized:
            return
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized in MentorEffectivenessService")
            except Exception as exc:
                logger.error("Failed to initialize OpenAI client: %s", exc)
                self._openai_client = None
        self._initialized = True

    def calculate_effectiveness(
        self,
        mentor_id: str,
        intern_improvement_rate: float,
        task_success_rate: float,
        at_risk_recovery_rate: float,
        avg_rating: float
    ) -> Dict[str, Any]:
        """
        Calculate composite mentor effectiveness score and generate coaching suggestions.
        """
        # Ensure rates are clamped between 0 and 100
        imp_rate = max(0.0, min(100.0, intern_improvement_rate))
        task_rate = max(0.0, min(100.0, task_success_rate))
        rec_rate = max(0.0, min(100.0, at_risk_recovery_rate))
        
        # Clamp rating between 0 and 5, scale to 0-100
        rating_val = max(0.0, min(5.0, avg_rating))
        rating_score = rating_val * 20.0

        # Calculate composite score
        # 30% Improvement, 30% Task Success, 20% At-risk Recovery, 20% Average Rating
        score = (0.30 * imp_rate) + (0.30 * task_rate) + (0.20 * rec_rate) + (0.20 * rating_score)
        score = round(score, 1)

        # Grade assignments
        if score >= 90.0:
            grade = "EXCELLENT"
        elif score >= 75.0:
            grade = "GOOD"
        elif score >= 50.0:
            grade = "AVERAGE"
        else:
            grade = "NEEDS_IMPROVEMENT"

        # Generate insight text (AI/OpenAI or Heuristic fallback)
        ai_insight = ""
        self._init_openai()

        if self._openai_client:
            try:
                prompt = (
                    f"Generate a brief, constructive feedback summary and actionable coaching recommendations "
                    f"for a mentor based on their performance metrics:\n"
                    f"- Composite Effectiveness Score: {score}/100\n"
                    f"- Grade: {grade}\n"
                    f"- Intern Skill Improvement Rate: {imp_rate}%\n"
                    f"- Task Submission Success Rate: {task_rate}%\n"
                    f"- At-Risk Intern Recovery Rate: {rec_rate}%\n"
                    f"- Average Intern Rating: {rating_val}/5\n\n"
                    f"Write exactly 2-3 sentences of feedback. Be direct, professional, and highlight where "
                    f"they can improve (e.g., focus more on at-risk recovery or maintain high engagement)."
                )

                response = self._openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional HR coach and mentor analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=200
                )
                ai_insight = response.choices[0].message.content.strip()
            except Exception as exc:
                logger.error("Failed to generate mentor effectiveness insights via OpenAI: %s", exc)

        # Heuristic fallback if OpenAI fails or is not configured
        if not ai_insight:
            if grade == "EXCELLENT":
                ai_insight = (
                    f"Outstanding performance! With a stellar score of {score}/100 and average rating of {rating_val}/5, "
                    f"you are providing top-tier guidance. Continue your proactive mentoring approach and consider "
                    f"sharing your best practices with other mentors."
                )
            elif grade == "GOOD":
                ai_insight = (
                    f"Great mentoring. Your score of {score}/100 indicates strong support for interns. "
                    f"To reach an excellent rating, look into boosting your at-risk recovery rate ({rec_rate}%) "
                    f"and ensuring all task reviews are completed on time."
                )
            elif grade == "AVERAGE":
                ai_insight = (
                    f"Moderate effectiveness shown with a score of {score}/100. Focus on improving your "
                    f"intern improvement rate ({imp_rate}%) and maintaining regular check-ins. Addressing "
                    f"blockers earlier will help recover at-risk interns."
                )
            else:
                ai_insight = (
                    f"Performance review indicates critical need for support (Score: {score}/100). "
                    f"Your average rating is {rating_val}/5 and task success rate is {task_rate}%. "
                    f"Please schedule a consultation with the HR department to review workload and coordinate coaching adjustments."
                )

        return {
            "effectivenessScore": score,
            "effectivenessGrade": grade,
            "aiInsight": ai_insight
        }

mentor_effectiveness_service = MentorEffectivenessService()
