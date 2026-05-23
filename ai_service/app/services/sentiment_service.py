"""
Sentiment Analysis Service — DistilBERT transformer pipeline.

Loads the pre-trained distilbert-base-uncased-finetuned-sst-2-english
model on initialisation and provides rich feedback analysis including
sentiment classification, keyword extraction, weak/strong area detection,
and improvement suggestions.
"""

import logging
from typing import Dict, Any, List

from app.utils.helpers import extract_keywords, normalize_confidence

logger = logging.getLogger(__name__)

# Keyword patterns for skill/weakness detection
_STRENGTH_INDICATORS = {
    "initiative", "proactive", "excellent", "outstanding", "reliable",
    "creative", "leadership", "teamwork", "communication", "fast",
    "thorough", "consistent", "dedicated", "efficient", "professional",
    "analytical", "organized", "collaborative", "innovative", "motivated",
}

_WEAKNESS_INDICATORS = {
    "struggle", "poor", "slow", "delayed", "missed", "incomplete",
    "unclear", "lacking", "unreliable", "absent", "late", "careless",
    "difficulty", "below", "inconsistent", "disorganized", "unfocused",
    "procrastinate", "isolated", "confused",
}


class SentimentService:
    """Analyses mentor feedback using a DistilBERT sentiment pipeline."""

    def __init__(self) -> None:
        self._pipeline = None
        self._load_model()

    def _load_model(self) -> None:
        """Load the HuggingFace sentiment-analysis pipeline."""
        try:
            from transformers import pipeline as hf_pipeline
            self._pipeline = hf_pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1,  # Force CPU
            )
            logger.info("Sentiment pipeline (DistilBERT) loaded successfully")
        except Exception as exc:
            logger.error("Failed to load sentiment pipeline: %s", exc)
            self._pipeline = None

    def analyze_sentiment(self, feedback_text: str) -> Dict[str, Any]:
        """Analyse a piece of feedback text and return structured results.

        Returns:
            Dict with sentiment, confidence_score, keywords,
            weak_areas, strong_skills, and improvement_suggestions.
        """
        text = feedback_text.strip()
        if not text:
            return self._empty_result()

        # ── 1. Run transformer pipeline ──────────────────────────────
        if self._pipeline is not None:
            try:
                result = self._pipeline(text[:512])[0]  # Truncate to model max
                raw_label = result["label"]  # "POSITIVE" or "NEGATIVE"
                raw_score = float(result["score"])
            except Exception as exc:
                logger.error("Sentiment inference failed: %s", exc)
                raw_label, raw_score = self._lexicon_fallback(text)
        else:
            raw_label, raw_score = self._lexicon_fallback(text)

        # Map to our standard labels
        if raw_label == "POSITIVE":
            sentiment = "POSITIVE"
        elif raw_label == "NEGATIVE":
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"

        # If confidence is low, treat as neutral
        if raw_score < 0.6:
            sentiment = "NEUTRAL"

        confidence = normalize_confidence(raw_score)

        # ── 2. Extract keywords ──────────────────────────────────────
        keywords = extract_keywords(text, top_n=10)

        # ── 3. Detect strong skills and weak areas ───────────────────
        words_lower = set(text.lower().split())
        strong_skills = [w for w in words_lower if w in _STRENGTH_INDICATORS]
        weak_areas = [w for w in words_lower if w in _WEAKNESS_INDICATORS]

        # ── 4. Generate improvement suggestions ──────────────────────
        suggestions = self._generate_suggestions(sentiment, weak_areas, strong_skills, text)

        logger.info(
            "Sentiment analysis: %s (conf=%.3f, keywords=%d)",
            sentiment, confidence, len(keywords),
        )

        return {
            "sentiment": sentiment,
            "confidence_score": confidence,
            "keywords": keywords,
            "weak_areas": weak_areas,
            "strong_skills": strong_skills,
            "improvement_suggestions": suggestions,
        }

    @staticmethod
    def _generate_suggestions(
        sentiment: str,
        weak_areas: List[str],
        strong_skills: List[str],
        text: str,
    ) -> List[str]:
        """Generate actionable improvement suggestions based on detected patterns."""
        suggestions = []

        weakness_to_suggestion = {
            "slow": "Work on improving task completion speed through better prioritisation.",
            "delayed": "Set personal deadlines ahead of official due dates to avoid delays.",
            "missed": "Use a task tracker or calendar reminders for all assignments.",
            "incomplete": "Ensure all deliverables are reviewed before submission.",
            "unclear": "Practice writing clear, structured documentation and reports.",
            "communication": "Join team discussions actively and seek feedback regularly.",
            "absent": "Maintain consistent attendance to stay aligned with team progress.",
            "late": "Improve punctuality by setting morning preparation routines.",
            "isolated": "Participate in team activities and collaborative projects.",
            "lacking": "Identify skill gaps and request targeted training from your mentor.",
            "careless": "Implement a personal review checklist before submitting work.",
            "inconsistent": "Establish daily routines and maintain steady work output.",
            "struggle": "Break challenging tasks into smaller steps and seek help early.",
            "difficulty": "Request additional training or pair programming sessions.",
            "poor": "Focus on fundamentals and consistent daily practice.",
        }

        for area in weak_areas:
            if area in weakness_to_suggestion:
                suggestions.append(weakness_to_suggestion[area])

        if sentiment == "NEGATIVE" and not suggestions:
            suggestions.append("Schedule a feedback session with your mentor to discuss areas for improvement.")
            suggestions.append("Set specific, measurable goals for the next review cycle.")

        if sentiment == "POSITIVE" and strong_skills:
            suggestions.append("Continue building on your strengths and consider mentoring peers.")

        if not suggestions:
            suggestions.append("Maintain your current performance and seek new challenges for growth.")

        return suggestions[:5]  # Cap at 5 suggestions

    @staticmethod
    def _lexicon_fallback(text: str):
        """Simple keyword-based fallback when transformer is unavailable."""
        text_lower = text.lower()
        pos = sum(1 for w in _STRENGTH_INDICATORS if w in text_lower)
        neg = sum(1 for w in _WEAKNESS_INDICATORS if w in text_lower)

        if pos > neg:
            return "POSITIVE", 0.7
        elif neg > pos:
            return "NEGATIVE", 0.7
        return "NEUTRAL", 0.5

    @staticmethod
    def _empty_result() -> Dict[str, Any]:
        return {
            "sentiment": "NEUTRAL",
            "confidence_score": 0.0,
            "keywords": [],
            "weak_areas": [],
            "strong_skills": [],
            "improvement_suggestions": ["No feedback text provided for analysis."],
        }
