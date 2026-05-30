import os
from typing import Dict, Any, List, Tuple

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "xgboost_model.joblib")
FEATURE_IMPORTANCE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "feature_importance.png")

FEATURE_NAMES = [
    "attendance_rate",
    "task_completion_rate",
    "avg_task_rating",
    "days_since_last_task",
    "communication_score",
    "skill_match_score",
    "week_number"
]

class PerformancePredictor:
    def __init__(self):
        self.model = None
        self.explainer = None
        self._loaded = False

    def _ensure_loaded(self):
        """Lazy-load model only when first needed."""
        if self._loaded:
            return
        self._loaded = True
        if os.path.exists(MODEL_PATH):
            import joblib
            self.model = joblib.load(MODEL_PATH)
            try:
                import shap
                self.explainer = shap.TreeExplainer(self.model)
            except Exception:
                self.explainer = None

    def train_model(self, X_train, y_train):
        """Trains the model with GridSearch and saves it."""
        import numpy as np
        import pandas as pd
        import xgboost as xgb
        import shap
        import joblib
        from sklearn.model_selection import GridSearchCV

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

        xgb_model = xgb.XGBClassifier(objective="multi:softprob", num_class=3, random_state=42)

        param_grid = {
            'max_depth': [3, 5, 7],
            'learning_rate': [0.01, 0.1, 0.2],
            'n_estimators': [50, 100, 200]
        }

        grid_search = GridSearchCV(xgb_model, param_grid, cv=3, scoring='accuracy', n_jobs=-1)
        grid_search.fit(X_train, y_train)

        self.model = grid_search.best_estimator_
        self.explainer = shap.TreeExplainer(self.model)

        joblib.dump(self.model, MODEL_PATH)
        self._generate_feature_importance_plot()
        self._loaded = True

        return {
            "best_params": grid_search.best_params_,
            "best_score": grid_search.best_score_
        }

    def _generate_feature_importance_plot(self):
        if not self.model:
            return
        import numpy as np
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        plt.figure(figsize=(10, 6))
        importance = self.model.feature_importances_
        sorted_idx = np.argsort(importance)

        plt.barh(range(len(sorted_idx)), importance[sorted_idx], align='center')
        plt.yticks(range(len(sorted_idx)), [FEATURE_NAMES[i] for i in sorted_idx])
        plt.xlabel('Feature Importance')
        plt.title('XGBoost Feature Importance')
        plt.tight_layout()
        plt.savefig(FEATURE_IMPORTANCE_PATH)
        plt.close()

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Predicts performance and returns SHAP explanation."""
        self._ensure_loaded()

        if not self.model:
            return self._dummy_predict(features)

        import numpy as np
        import pandas as pd

        df = pd.DataFrame([features])[FEATURE_NAMES]

        probs = self.model.predict_proba(df)[0]
        pred_class = int(np.argmax(probs))
        confidence = float(probs[pred_class])

        labels = ['at-risk', 'average', 'high-performer']
        prediction_label = labels[pred_class]

        # SHAP explainability
        top_factors = []
        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(df)
                class_shap_values = shap_values[pred_class][0]
                for i, val in enumerate(class_shap_values):
                    top_factors.append({
                        "factor": FEATURE_NAMES[i],
                        "impact": float(val)
                    })
                top_factors.sort(key=lambda x: abs(x["impact"]), reverse=True)
            except Exception:
                for i, name in enumerate(FEATURE_NAMES):
                    top_factors.append({"factor": name, "impact": 0.0})
        else:
            for i, name in enumerate(FEATURE_NAMES):
                top_factors.append({"factor": name, "impact": 0.0})

        explanation = f"Predicted as {prediction_label} primarily because of {top_factors[0]['factor']}."

        return {
            "prediction": prediction_label,
            "confidence": round(confidence, 4),
            "explanation": explanation,
            "topFactors": top_factors[:3]
        }

    def _dummy_predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        score = sum(features.values()) / len(features)
        pred = 'average'
        if score > 0.8:
            pred = 'high-performer'
        elif score < 0.4:
            pred = 'at-risk'

        return {
            "prediction": pred,
            "confidence": 0.85,
            "explanation": "Model not trained. Using dummy heuristic.",
            "topFactors": [
                {"factor": "attendance_rate", "impact": 0.5},
                {"factor": "task_completion_rate", "impact": 0.3}
            ]
        }

predictor_instance = PerformancePredictor()
