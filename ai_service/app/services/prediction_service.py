"""
Performance Prediction Service — sklearn pipeline inference.

Loads the trained RandomForest pipeline and label encoder at init,
then predicts performance level, risk assessment, and success
probability for each incoming request.
"""

from __future__ import annotations
import os
import logging
from typing import Dict, Any

from app.config.settings import settings
from app.utils.helpers import normalize_confidence

logger = logging.getLogger(__name__)


class PredictionService:
    """Predicts intern performance using a pre-trained sklearn pipeline."""

    def __init__(self) -> None:
        self._pipeline = None
        self._label_encoder = None
        self._loaded = False

    def _load_models(self) -> None:
        """Load the performance model and label encoder from disk."""
        if self._loaded: return
        model_path = os.path.join(settings.MODEL_DIR, "performance_model.pkl")
        encoder_path = os.path.join(settings.MODEL_DIR, "performance_label_encoder.pkl")

        import joblib
        try:
            self._pipeline = joblib.load(model_path)
            logger.info("Performance model loaded from %s", model_path)
        except FileNotFoundError:
            logger.warning("Performance model not found at %s — run train_prediction.py first", model_path)

        try:
            self._label_encoder = joblib.load(encoder_path)
            logger.info("Label encoder loaded from %s", encoder_path)
        except FileNotFoundError:
            logger.warning("Label encoder not found at %s", encoder_path)
        self._loaded = True

    def predict_performance(
        self,
        attendance_rate: float,
        task_completion_rate: float,
        feedback_score: float,
        productivity_score: float,
        submission_rate: float,
    ) -> Dict[str, Any]:
        """Run the prediction pipeline and return structured results.

        Args:
            attendance_rate: 0.0–1.0
            task_completion_rate: 0.0–1.0
            feedback_score: 0.0–5.0
            productivity_score: 0.0–1.0
            submission_rate: 0.0–1.0

        Returns:
            Dict with predicted_performance_score, productivity_level,
            risk_level, internship_success_probability, key_drivers,
            and recommendations.
        """
        self._load_models()
        # Sanitise inputs with sensible defaults
        attendance_rate = max(0.0, min(1.0, attendance_rate or 0.5))
        task_completion_rate = max(0.0, min(1.0, task_completion_rate or 0.5))
        feedback_score = max(0.0, min(5.0, feedback_score or 2.5))
        productivity_score = max(0.0, min(1.0, productivity_score or 0.5))
        submission_rate = max(0.0, min(1.0, submission_rate or 0.5))

        if self._pipeline is None or self._label_encoder is None:
            logger.warning("Models not loaded — returning fallback prediction")
            return self._fallback_prediction(
                attendance_rate, task_completion_rate, feedback_score,
                productivity_score, submission_rate,
            )

        # Prepare feature vector (must match training column order)
        import numpy as np
        features = np.array([[
            attendance_rate,
            task_completion_rate,
            feedback_score,
            productivity_score,
            submission_rate,
        ]])

        # ── Predict class ────────────────────────────────────────────
        predicted_class = self._pipeline.predict(features)[0]
        predicted_label = self._label_encoder.inverse_transform([predicted_class])[0]

        # ── Predict probabilities ────────────────────────────────────
        probabilities = self._pipeline.predict_proba(features)[0]
        class_names = list(self._label_encoder.classes_)
        high_idx = class_names.index("High") if "High" in class_names else -1
        success_prob = float(probabilities[high_idx]) if high_idx >= 0 else 0.5

        # ── Productivity level ───────────────────────────────────────
        if productivity_score >= 0.85:
            productivity_level = "Highly Productive"
        elif productivity_score >= 0.65:
            productivity_level = "Moderately Productive"
        else:
            productivity_level = "Needs Improvement"

        # ── Risk level ───────────────────────────────────────────────
        if predicted_label == "Low" or attendance_rate < 0.7 or task_completion_rate < 0.5:
            risk_level = "At Risk"
        elif predicted_label == "High" and attendance_rate >= 0.9:
            risk_level = "Excellent"
        else:
            risk_level = "Stable"

        # ── Key drivers ──────────────────────────────────────────────
        key_drivers = self._analyse_drivers(
            attendance_rate, task_completion_rate, feedback_score,
            productivity_score, submission_rate,
        )

        # ── Recommendations ──────────────────────────────────────────
        recommendations = self._generate_recommendations(
            predicted_label, attendance_rate, task_completion_rate,
            feedback_score, productivity_score, submission_rate,
        )

        logger.info(
            "Performance prediction: %s (risk=%s, success_prob=%.2f)",
            predicted_label, risk_level, success_prob,
        )

        return {
            "predicted_performance_score": predicted_label,
            "productivity_level": productivity_level,
            "risk_level": risk_level,
            "internship_success_probability": round(normalize_confidence(success_prob), 4),
            "key_drivers": key_drivers,
            "recommendations": recommendations,
        }

    @staticmethod
    def _analyse_drivers(
        attendance: float, completion: float, feedback: float,
        productivity: float, submission: float,
    ) -> list:
        """Identify the key factors influencing the prediction."""
        drivers = []

        if completion >= 0.85:
            drivers.append("Strong task completion rate is a major positive driver.")
        elif completion < 0.6:
            drivers.append("Low task completion rate significantly limits overall rating.")

        if attendance >= 0.93:
            drivers.append("Excellent attendance demonstrates high reliability.")
        elif attendance < 0.75:
            drivers.append("Poor attendance creates a negative impact on scoring.")

        if productivity >= 0.8:
            drivers.append("High productivity score indicates efficient work velocity.")
        elif productivity < 0.5:
            drivers.append("Below-average productivity suggests room for growth.")

        if feedback >= 4.0:
            drivers.append("Positive mentor feedback reflects strong collaboration.")
        elif feedback < 2.5:
            drivers.append("Critical feedback from mentors highlights areas needing attention.")

        if submission >= 0.85:
            drivers.append("Consistent on-time submissions show reliable work habits.")
        elif submission < 0.6:
            drivers.append("Late or missing submissions affect overall performance.")

        if not drivers:
            drivers.append("Balanced metrics contribute to a stable performance profile.")

        return drivers

    @staticmethod
    def _generate_recommendations(
        label: str, attendance: float, completion: float,
        feedback: float, productivity: float, submission: float,
    ) -> list:
        """Generate actionable improvement suggestions based on metrics."""
        recs = []

        if attendance < 0.8:
            recs.append("Prioritise daily check-ins and maintain a consistent work schedule.")
        if completion < 0.7:
            recs.append("Break tasks into smaller sub-tasks and set daily milestones.")
        if productivity < 0.6:
            recs.append("Use time-blocking techniques to improve focus and output velocity.")
        if feedback < 3.0:
            recs.append("Schedule regular one-on-one sessions with your mentor for guidance.")
        if submission < 0.7:
            recs.append("Set personal deadlines 1-2 days before official due dates.")

        if label == "High" and not recs:
            recs.append("Outstanding performance — consider mentoring other interns.")
            recs.append("Explore advanced projects or cross-department collaboration opportunities.")
        elif not recs:
            recs.append("Maintain current performance and seek stretch assignments for growth.")

        return recs

    @staticmethod
    def _fallback_prediction(
        attendance: float, completion: float, feedback: float,
        productivity: float, submission: float,
    ) -> Dict[str, Any]:
        """Weighted formula fallback when ML models are unavailable."""
        weighted = (
            attendance * 0.20 +
            completion * 0.25 +
            (feedback / 5.0) * 0.20 +
            productivity * 0.20 +
            submission * 0.15
        )

        if weighted >= 0.8:
            label, risk = "High", "Excellent"
        elif weighted >= 0.6:
            label, risk = "Medium", "Stable"
        else:
            label, risk = "Low", "At Risk"

        return {
            "predicted_performance_score": label,
            "productivity_level": "Moderately Productive",
            "risk_level": risk,
            "internship_success_probability": round(weighted, 4),
            "key_drivers": ["[Fallback] Weighted average formula used — ML model not available."],
            "recommendations": ["Run train_prediction.py to enable ML-based predictions."],
        }
