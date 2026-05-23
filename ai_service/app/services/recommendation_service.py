"""
Recommendation Service — Tiered task and skill recommendations.

Generates personalised recommendations based on the intern's current
performance level, skills, department, and mentor feedback. Results
are cached in Redis by intern_id with a 30-minute TTL.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from app.utils.helpers import normalize_confidence

logger = logging.getLogger(__name__)


# ── Recommendation catalogues per performance tier ───────────────────

_LOW_PERFORMANCE = {
    "tasks": [
        "Complete a guided tutorial on core department tools",
        "Shadow a senior team member for one full day",
        "Write a summary report of your current project understanding",
        "Attend all daily standup meetings this week without exception",
        "Create a personal productivity plan with daily milestones",
    ],
    "skills": [
        "Time management fundamentals",
        "Written communication basics",
        "Task prioritisation techniques",
        "Professional email etiquette",
        "Basic version control (Git)",
    ],
    "resources": [
        "LinkedIn Learning: Time Management Foundations",
        "Coursera: Learning How to Learn",
        "YouTube: Git & GitHub for Beginners",
        "Company Wiki: Onboarding Best Practices",
        "Book: The First 90 Days by Michael Watkins",
    ],
}

_MEDIUM_PERFORMANCE = {
    "tasks": [
        "Lead a small feature implementation end-to-end",
        "Present your weekly progress to the team",
        "Write technical documentation for a module you worked on",
        "Review a peer's code or work submission and provide feedback",
        "Identify and fix one non-critical bug in the project",
    ],
    "skills": [
        "Advanced problem-solving techniques",
        "Code review best practices",
        "Technical documentation writing",
        "Stakeholder communication",
        "Unit testing and test-driven development",
    ],
    "resources": [
        "Udemy: Advanced Python Programming",
        "Pluralsight: Clean Code Principles",
        "YouTube: System Design Fundamentals",
        "Company Wiki: Code Review Guidelines",
        "Book: Clean Code by Robert C. Martin",
    ],
}

_HIGH_PERFORMANCE = {
    "tasks": [
        "Mentor a new intern during their onboarding week",
        "Propose and lead a process improvement initiative",
        "Build a prototype or proof-of-concept for a new feature",
        "Present a tech talk or knowledge-sharing session to the team",
        "Contribute to cross-department collaboration on a strategic project",
    ],
    "skills": [
        "Leadership and team coordination",
        "System architecture and design patterns",
        "Presentation and public speaking",
        "Project management fundamentals",
        "Advanced domain-specific expertise",
    ],
    "resources": [
        "Coursera: Leading Teams by University of Michigan",
        "Udemy: Software Architecture & Design",
        "YouTube: Tech Talk Best Practices",
        "Company Wiki: Leadership Track Programme",
        "Book: The Manager's Path by Camille Fournier",
    ],
}

_DEPARTMENT_EXTRAS = {
    "Engineering": ["Explore CI/CD pipeline optimisation", "Contribute to open-source tools used in the stack"],
    "Data Science": ["Build an end-to-end ML pipeline", "Publish findings in an internal knowledge base"],
    "Marketing": ["Run an A/B test on a campaign element", "Analyse competitor marketing strategies"],
    "Design": ["Create a design system component library", "Conduct a usability study with real users"],
    "HR": ["Streamline the new hire onboarding checklist", "Build a candidate experience survey"],
}


class RecommendationService:
    """Generates personalised recommendations based on performance level."""

    def get_recommendations(
        self,
        intern_id: str,
        skills: List[str],
        performance_score: float,
        department: str,
        feedback_summary: str,
        redis_client=None,
    ) -> Dict[str, Any]:
        """Generate tiered recommendations for an intern.

        Args:
            intern_id: Unique intern identifier.
            skills: Current skill set.
            performance_score: 0.0–1.0 normalised score.
            department: Assigned department.
            feedback_summary: Recent mentor feedback text.
            redis_client: Optional Redis client for caching.

        Returns:
            Dict with recommended_tasks, skills_to_learn,
            recommended_departments, training_resources, and reasoning.
        """
        # ── Check Redis cache ────────────────────────────────────────
        cached = self._get_cached(redis_client, intern_id)
        if cached:
            logger.info("Returning cached recommendations for intern %s", intern_id)
            return cached

        # ── Determine performance tier ───────────────────────────────
        score = normalize_confidence(performance_score)

        if score < 0.4:
            tier = "low"
            catalogue = _LOW_PERFORMANCE
            reasoning_prefix = "Based on your current performance metrics, we recommend focusing on foundational growth."
        elif score < 0.75:
            tier = "medium"
            catalogue = _MEDIUM_PERFORMANCE
            reasoning_prefix = "You're performing well — these recommendations will help you reach the next level."
        else:
            tier = "high"
            catalogue = _HIGH_PERFORMANCE
            reasoning_prefix = "Excellent performance! These recommendations focus on leadership and advanced growth."

        # ── Build recommendations ────────────────────────────────────
        recommended_tasks = list(catalogue["tasks"])
        skills_to_learn = list(catalogue["skills"])
        training_resources = list(catalogue["resources"])

        # Add department-specific tasks
        dept_extras = _DEPARTMENT_EXTRAS.get(department, [])
        recommended_tasks.extend(dept_extras)

        # Suggest related departments for cross-training
        all_departments = list(_DEPARTMENT_EXTRAS.keys())
        recommended_departments = [d for d in all_departments if d != department][:2]

        # Build reasoning
        reasoning = (
            f"{reasoning_prefix} "
            f"Your performance score of {score:.0%} places you in the {tier} tier. "
            f"Department: {department}. "
            f"We identified {len(skills)} current skills and recommend "
            f"{len(skills_to_learn)} new skills to develop."
        )

        if feedback_summary:
            reasoning += f" Recent feedback highlights: {feedback_summary[:100]}."

        result = {
            "recommended_tasks": recommended_tasks,
            "skills_to_learn": skills_to_learn,
            "recommended_departments": recommended_departments,
            "training_resources": training_resources,
            "reasoning": reasoning,
        }

        # ── Cache in Redis (TTL 30 minutes) ──────────────────────────
        self._set_cached(redis_client, intern_id, result)

        logger.info(
            "Generated %s-tier recommendations for intern %s (score=%.2f)",
            tier, intern_id, score,
        )

        return result

    @staticmethod
    def _get_cached(redis_client, intern_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached recommendations from Redis."""
        if redis_client is None:
            return None
        try:
            data = redis_client.get(f"rec:{intern_id}")
            if data:
                return json.loads(data)
        except Exception as exc:
            logger.warning("Redis cache read failed (non-critical): %s", exc)
        return None

    @staticmethod
    def _set_cached(redis_client, intern_id: str, result: Dict[str, Any]) -> None:
        """Cache recommendations in Redis with a 30-minute TTL."""
        if redis_client is None:
            return
        try:
            redis_client.set(f"rec:{intern_id}", json.dumps(result), ex=1800)
        except Exception as exc:
            logger.warning("Redis cache write failed (non-critical): %s", exc)
