"""
Role Matching Service — Semantic department matching using sentence embeddings.

Loads pre-computed department vector embeddings on initialisation and
matches incoming intern profiles by computing cosine similarity between
the intern's combined profile text and each department embedding.
"""

from __future__ import annotations
import os
import logging
from typing import Dict, Any, List, Optional

from app.config.settings import settings
from app.utils.helpers import cosine_similarity_score, normalize_confidence

logger = logging.getLogger(__name__)


class MatchingService:
    """Matches intern profiles to departments using sentence-transformer embeddings."""

    def __init__(self) -> None:
        self._model = None
        self._dept_data: Optional[Dict[str, Any]] = None
        self._loaded = False

    def _load_models(self) -> None:
        """Load the sentence-transformer model and department vectors."""
        if self._loaded: return
        vectors_path = os.path.join(settings.VECTOR_DIR, "department_vectors.pkl")

        try:
            import joblib
            self._dept_data = joblib.load(vectors_path)
            logger.info(
                "Loaded department vectors for %d departments from %s",
                len(self._dept_data["department_names"]),
                vectors_path,
            )
        except FileNotFoundError:
            logger.warning(
                "Department vectors not found at %s — run train_matching.py first",
                vectors_path,
            )
            self._dept_data = None

        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully")
        except Exception as exc:
            logger.error("Failed to load SentenceTransformer: %s", exc)
            self._model = None
        self._loaded = True

    def match_role(
        self,
        skills: List[str],
        education: str,
        interests: List[str],
        technologies: List[str],
    ) -> Dict[str, Any]:
        """Match an intern profile against department embeddings.

        Returns the best department match with similarity score, recommended
        role, suggested technologies, and a human-readable rationale.
        """
        self._load_models()
        if self._model is None or self._dept_data is None:
            logger.warning("Models not loaded — returning fallback match")
            return self._fallback_match(skills)

        # Build a rich profile string mirroring the department format
        profile_text = (
            f"Skills: {', '.join(skills)}. "
            f"Education: {education}. "
            f"Interests: {', '.join(interests)}. "
            f"Technologies: {', '.join(technologies)}."
        )

        # Encode the intern profile
        intern_embedding = self._model.encode([profile_text], convert_to_numpy=True)[0]

        import numpy as np
        dept_names: List[str] = self._dept_data["department_names"]
        dept_embeddings: np.ndarray = self._dept_data["embeddings"]
        dept_technologies: Dict[str, List[str]] = self._dept_data.get("technologies", {})
        dept_roles: Dict[str, List[str]] = self._dept_data.get("roles", {})

        # Compute similarity against every department
        best_idx = 0
        best_score = -1.0
        scores: List[float] = []

        for i, dept_emb in enumerate(dept_embeddings):
            sim = cosine_similarity_score(intern_embedding, dept_emb)
            scores.append(sim)
            if sim > best_score:
                best_score = sim
                best_idx = i

        best_dept = dept_names[best_idx]
        match_pct = round(normalize_confidence(best_score, 0.0, 1.0) * 100, 1)

        # Select the most relevant role within the department
        available_roles = dept_roles.get(best_dept, [f"General Intern in {best_dept}"])
        recommended_role = available_roles[0] if available_roles else f"Intern in {best_dept}"

        # Determine suggested technologies from the department profile
        suggested_techs = dept_technologies.get(best_dept, [])[:5]

        # Identify matched and missing skills
        intern_skills_lower = {s.lower().strip() for s in skills}
        dept_skill_text = self._dept_data.get("profiles", {}).get(best_dept, "").lower()
        matched = [s for s in skills if s.lower() in dept_skill_text]
        missing = [s for s in suggested_techs if s.lower() not in intern_skills_lower]

        # Build rationale
        if match_pct >= 75:
            strength = "excellent fit"
            advice = "highly recommended for direct onboarding"
        elif match_pct >= 50:
            strength = "strong fit"
            advice = "recommended with introductory mentorship"
        elif match_pct >= 30:
            strength = "moderate fit"
            advice = "may benefit from foundational training first"
        else:
            strength = "partial fit"
            advice = "significant upskilling recommended before assignment"

        rationale = (
            f"Your profile represents a {strength} ({match_pct}%) for the "
            f"'{best_dept}' department. You matched {len(matched)} skills "
            f"with the department profile. This role is {advice}."
        )

        logger.info(
            "Role match completed: %s → %s (%.1f%%)",
            ", ".join(skills[:3]),
            best_dept,
            match_pct,
        )

        return {
            "match_percentage": match_pct,
            "best_department": best_dept,
            "recommended_role": recommended_role,
            "suggested_technologies": suggested_techs,
            "matched_skills": matched,
            "missing_skills": missing,
            "rationale": rationale,
        }

    @staticmethod
    def _fallback_match(skills: List[str]) -> Dict[str, Any]:
        """Keyword-based fallback when ML models are unavailable."""
        dept_keywords = {
            "Engineering": ["python", "java", "javascript", "react", "node", "docker", "api", "backend", "frontend", "devops"],
            "Data Science": ["data", "ml", "machine learning", "pandas", "tensorflow", "statistics", "analytics", "nlp"],
            "Marketing": ["marketing", "seo", "content", "social media", "branding", "analytics", "ads", "copywriting"],
            "Design": ["design", "figma", "photoshop", "ui", "ux", "illustration", "wireframe", "prototype"],
            "HR": ["hr", "recruitment", "onboarding", "training", "payroll", "compliance", "hris", "talent"],
        }

        skills_lower = {s.lower() for s in skills}
        best_dept = "Engineering"
        best_overlap = 0

        for dept, keywords in dept_keywords.items():
            overlap = len(skills_lower.intersection(set(keywords)))
            if overlap > best_overlap:
                best_overlap = overlap
                best_dept = dept

        return {
            "match_percentage": min(best_overlap * 20.0, 100.0),
            "best_department": best_dept,
            "recommended_role": f"General Intern in {best_dept}",
            "suggested_technologies": [],
            "matched_skills": list(skills_lower.intersection(set(dept_keywords.get(best_dept, [])))),
            "missing_skills": [],
            "rationale": f"[Fallback] Keyword matching placed you in {best_dept} based on {best_overlap} skill overlaps.",
        }
