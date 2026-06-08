import numpy as np
from sklearn.linear_model import Ridge
from app.schemas.ai import PerformancePredictRequest, PerformancePredictResponse

import threading

class PerformanceService:
    def __init__(self):
        self.model = None
        self._loaded = False
        self._lock = threading.Lock()

    def _ensure_loaded(self):
        """Train the Ridge model lazily on first request."""
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            # 1. Seed historical training data for our regression model
            # Features: [Attendance (0-1), Task Completion (0-1), Sentiment (-1 to 1), Productivity (0-1)]
            # Target: Final Score (0-100)
            X_train = np.array([
                [0.98, 0.95, 0.85, 0.92],  # Stellar intern -> 96
                [0.95, 0.90, 0.60, 0.85],  # Strong intern -> 89
                [0.90, 0.80, 0.40, 0.75],  # Average intern -> 78
                [0.85, 0.70, 0.10, 0.65],  # Below average -> 67
                [0.70, 0.50, -0.30, 0.40], # Poor performer -> 45
                [1.00, 1.00, 0.95, 0.98],  # Perfect performer -> 100
                [0.60, 0.40, -0.60, 0.30], # Underperformer -> 35
                [0.92, 0.88, 0.55, 0.80],  # Above average -> 84
                [0.88, 0.75, 0.20, 0.70],  # Average -> 73
                [0.78, 0.62, -0.10, 0.55], # Warning signs -> 58
                [0.96, 0.92, 0.70, 0.90],  # Great job -> 92
                [0.91, 0.85, 0.50, 0.78],  # Solid -> 81
                [0.84, 0.68, 0.05, 0.60],  # Needs push -> 64
                [0.72, 0.48, -0.40, 0.35], # Low active -> 41
                [0.97, 0.94, 0.80, 0.88],  # Highly productive -> 93
                [0.89, 0.82, 0.35, 0.72],  # Good standard -> 79
                [0.82, 0.65, 0.00, 0.58],  # Slow progress -> 61
                [0.65, 0.45, -0.50, 0.25], # High risk -> 32
                [0.99, 0.98, 0.90, 0.95],  # Exceptional -> 98
                [0.86, 0.77, 0.15, 0.68],  # Reliable average -> 74
            ])
            
            y_train = np.array([
                96.0, 89.0, 78.0, 67.0, 45.0, 100.0, 35.0, 84.0, 73.0, 58.0,
                92.0, 81.0, 64.0, 41.0, 93.0, 79.0, 61.0, 32.0, 98.0, 74.0
            ])

            # 2. Train a Ridge regression model
            self.model = Ridge(alpha=1.0)
            self.model.fit(X_train, y_train)
            self._loaded = True

    def predict_performance(self, data: PerformancePredictRequest) -> PerformancePredictResponse:
        self._ensure_loaded()
        # Assemble feature array
        features = np.array([[
            data.attendance_rate,
            data.task_completion_rate,
            data.feedback_sentiment_score,
            data.productivity_score
        ]])

        # Execute machine learning inference
        predicted = self.model.predict(features)[0]
        
        # Keep score within logical limits of 0 - 100
        predicted_score = min(100.0, max(0.0, round(float(predicted), 1)))

        # 1. Letter Grade allocation
        if predicted_score >= 90.0:
            grade = "A"
        elif predicted_score >= 80.0:
            grade = "B"
        elif predicted_score >= 70.0:
            grade = "C"
        elif predicted_score >= 60.0:
            grade = "D"
        else:
            grade = "F"

        # 2. Risk Level assessment
        # Automatically flag high risk if key metrics are under critical limits
        if data.attendance_rate < 0.75 or data.task_completion_rate < 0.60 or predicted_score < 60.0:
            risk = "HIGH"
        elif data.attendance_rate < 0.85 or data.task_completion_rate < 0.75 or predicted_score < 75.0:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        # 3. Analyze Key Drivers
        drivers = []
        # Weights or coefficient impact can be determined from model coefficients
        # Coefficients are roughly: [~20, ~25, ~15, ~30] representing relative importance
        if data.task_completion_rate >= 0.85:
            drivers.append("Exceptional task completion rate stands out as a strong positive driver.")
        elif data.task_completion_rate < 0.70:
            drivers.append("Low task completion rate significantly limits overall rating.")

        if data.attendance_rate >= 0.95:
            drivers.append("Stellar attendance registers high consistency and operational reliability.")
        elif data.attendance_rate < 0.80:
            drivers.append("Poor daily attendance creates a major negative bottleneck in overall scoring.")

        if data.productivity_score >= 0.85:
            drivers.append("High daily productivity score suggests excellent work velocity.")
        elif data.productivity_score < 0.65:
            drivers.append("Under-average productivity score indicates slow progress and room for growth.")

        if data.feedback_sentiment_score > 0.5:
            drivers.append("Very positive feedback comments from mentors indicate strong team collaboration.")
        elif data.feedback_sentiment_score < 0.0:
            drivers.append("Mentors indicate reservations or critical remarks in their feedback reports.")

        if not drivers:
            drivers.append("Consistent average metrics provide a stable and steady performance footprint.")

        # 4. Generate Actionable Suggestions
        suggestions = []
        if data.attendance_rate < 0.85:
            suggestions.append("Address check-in gaps immediately and maintain regular working schedules.")
        if data.task_completion_rate < 0.75:
            suggestions.append("Set daily goals, decompose tasks into sub-tasks, and connect with mentors on blocked items.")
        if data.productivity_score < 0.70:
            suggestions.append("Focus on improving response rates, task velocity, and submission timeliness.")
        if data.feedback_sentiment_score < 0.2:
            suggestions.append("Request a one-to-one sync with your mentor to clear up feedback items and resolve skill blocks.")
        
        if not suggestions:
            suggestions.append("Excellent current performance. Maintain your standard and explore peer mentoring opportunities.")

        return PerformancePredictResponse(
            predicted_performance_grade=grade,
            predicted_score=predicted_score,
            risk_level=risk,
            key_drivers=drivers,
            reconciliation_suggestions=suggestions
        )
