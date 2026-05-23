"""
Analytics Service — Dataset-driven performance analytics.

Loads the performance dataset and computes aggregate statistics
including productivity trends, risk distribution, skill gaps,
top performers, and department performance. Results are cached
in Redis with a 10-minute TTL.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List

import pandas as pd
import numpy as np

from app.config.settings import settings

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Computes aggregate performance analytics from the intern dataset."""

    def __init__(self) -> None:
        self._data_path = os.path.join(settings.DATA_DIR, "performance_dataset.csv")

    def get_analytics(
        self,
        department: Optional[str] = None,
        date_range: Optional[str] = None,
        redis_client=None,
    ) -> Dict[str, Any]:
        """Compute and return comprehensive analytics.

        Args:
            department: Optional filter by department name.
            date_range: Optional date range string (reserved for future use).
            redis_client: Optional Redis client for caching.

        Returns:
            Dict with productivity_trend, risk_distribution,
            skill_gap_analysis, top_performers, department_performance,
            ai_insights, and total_interns_analysed.
        """
        # ── Check Redis cache ────────────────────────────────────────
        cache_key = f"analytics:{department or 'global'}"
        cached = self._get_cached(redis_client, cache_key)
        if cached:
            logger.info("Returning cached analytics for key %s", cache_key)
            return cached

        # ── Load dataset ─────────────────────────────────────────────
        try:
            df = pd.read_csv(self._data_path)
            logger.info("Loaded performance dataset: %d rows", len(df))
        except FileNotFoundError:
            logger.error("Performance dataset not found at %s", self._data_path)
            return self._empty_result()

        total_interns = len(df)

        # ── 1. Productivity trend ────────────────────────────────────
        productivity_trend = {
            "average_productivity": round(float(df["productivity_score"].mean()), 3),
            "median_productivity": round(float(df["productivity_score"].median()), 3),
            "std_productivity": round(float(df["productivity_score"].std()), 3),
            "average_attendance": round(float(df["attendance_rate"].mean()), 3),
            "average_task_completion": round(float(df["task_completion_rate"].mean()), 3),
            "average_submission_rate": round(float(df["submission_rate"].mean()), 3),
        }

        # ── 2. Risk distribution ─────────────────────────────────────
        risk_counts: Dict[str, int] = {"At Risk": 0, "Stable": 0, "Excellent": 0}
        for _, row in df.iterrows():
            if row["performance_label"] == "Low":
                risk_counts["At Risk"] += 1
            elif row["performance_label"] == "High":
                risk_counts["Excellent"] += 1
            else:
                risk_counts["Stable"] += 1

        # ── 3. Skill gap analysis ────────────────────────────────────
        skill_gaps = self._compute_skill_gaps(df)

        # ── 4. Top performers ────────────────────────────────────────
        top_df = df.nlargest(5, "productivity_score")
        top_performers = []
        for _, row in top_df.iterrows():
            top_performers.append({
                "intern_id": str(row["intern_id"]),
                "productivity_score": round(float(row["productivity_score"]), 3),
                "task_completion_rate": round(float(row["task_completion_rate"]), 3),
                "attendance_rate": round(float(row["attendance_rate"]), 3),
                "performance_label": str(row["performance_label"]),
            })

        # ── 5. Department performance (label distribution) ───────────
        label_dist = df["performance_label"].value_counts().to_dict()
        department_performance = {
            "label_distribution": {str(k): int(v) for k, v in label_dist.items()},
            "high_percentage": round(label_dist.get("High", 0) / total_interns * 100, 1),
            "low_percentage": round(label_dist.get("Low", 0) / total_interns * 100, 1),
        }

        # ── 6. AI insights ───────────────────────────────────────────
        ai_insights = self._generate_insights(
            df, productivity_trend, risk_counts, total_interns,
        )

        result = {
            "productivity_trend": productivity_trend,
            "risk_distribution": risk_counts,
            "skill_gap_analysis": skill_gaps,
            "top_performers": top_performers,
            "department_performance": department_performance,
            "ai_insights": ai_insights,
            "total_interns_analysed": total_interns,
        }

        # ── Cache result (TTL 10 minutes) ────────────────────────────
        self._set_cached(redis_client, cache_key, result)

        logger.info("Analytics computed for %d interns", total_interns)
        return result

    @staticmethod
    def _compute_skill_gaps(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify performance dimensions where interns underperform."""
        metrics = {
            "attendance_rate": {"threshold": 0.80, "label": "Attendance"},
            "task_completion_rate": {"threshold": 0.70, "label": "Task Completion"},
            "feedback_score": {"threshold": 3.0, "label": "Mentor Feedback"},
            "productivity_score": {"threshold": 0.65, "label": "Productivity"},
            "submission_rate": {"threshold": 0.70, "label": "On-time Submissions"},
        }

        gaps = []
        for col, meta in metrics.items():
            below = len(df[df[col] < meta["threshold"]])
            pct = round(below / len(df) * 100, 1) if len(df) > 0 else 0.0
            if pct > 10:  # Only report if >10% of interns are below threshold
                gaps.append({
                    "metric": meta["label"],
                    "threshold": meta["threshold"],
                    "interns_below": below,
                    "percentage_below": pct,
                    "recommendation": f"Targeted improvement programme for {meta['label'].lower()} is recommended.",
                })

        return gaps

    @staticmethod
    def _generate_insights(
        df: pd.DataFrame,
        trend: Dict[str, Any],
        risk: Dict[str, int],
        total: int,
    ) -> List[str]:
        """Generate human-readable AI insight strings."""
        insights = []

        avg_prod = trend["average_productivity"]
        if avg_prod >= 0.8:
            insights.append(
                f"Overall productivity is strong at {avg_prod:.0%} — the cohort is performing above expectations."
            )
        elif avg_prod >= 0.6:
            insights.append(
                f"Average productivity of {avg_prod:.0%} is acceptable but there is room for improvement."
            )
        else:
            insights.append(
                f"⚠️ Average productivity is low at {avg_prod:.0%} — consider cohort-wide intervention."
            )

        at_risk_pct = round(risk["At Risk"] / total * 100, 1) if total > 0 else 0
        if at_risk_pct > 0:
            insights.append(
                f"{at_risk_pct}% of interns ({risk['At Risk']}) are at risk — recommend immediate mentor check-ins."
            )

        excellent_pct = round(risk["Excellent"] / total * 100, 1) if total > 0 else 0
        if excellent_pct > 0:
            insights.append(
                f"{excellent_pct}% of interns ({risk['Excellent']}) are in the Excellent category — consider them for advanced projects."
            )

        avg_attendance = trend["average_attendance"]
        if avg_attendance < 0.85:
            insights.append(
                f"Average attendance of {avg_attendance:.0%} is below the 85% target. Consider attendance improvement initiatives."
            )

        avg_completion = trend["average_task_completion"]
        insights.append(
            f"Task completion rate averages {avg_completion:.0%} across all interns."
        )

        return insights[:5]

    @staticmethod
    def _get_cached(redis_client, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached analytics from Redis."""
        if redis_client is None:
            return None
        try:
            data = redis_client.get(cache_key)
            if data:
                return json.loads(data)
        except Exception as exc:
            logger.warning("Redis cache read failed: %s", exc)
        return None

    @staticmethod
    def _set_cached(redis_client, cache_key: str, result: Dict[str, Any]) -> None:
        """Cache analytics result in Redis with a 10-minute TTL."""
        if redis_client is None:
            return
        try:
            redis_client.set(cache_key, json.dumps(result, default=str), ex=600)
        except Exception as exc:
            logger.warning("Redis cache write failed: %s", exc)

    @staticmethod
    def _empty_result() -> Dict[str, Any]:
        return {
            "productivity_trend": {},
            "risk_distribution": {"At Risk": 0, "Stable": 0, "Excellent": 0},
            "skill_gap_analysis": [],
            "top_performers": [],
            "department_performance": {},
            "ai_insights": ["Dataset not available — run training scripts first."],
            "total_interns_analysed": 0,
        }
