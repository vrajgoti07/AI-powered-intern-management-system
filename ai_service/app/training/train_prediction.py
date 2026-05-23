"""
Training script for the Performance Prediction model.

Loads the performance dataset, builds a StandardScaler + RandomForest
pipeline, trains on an 80/20 split, prints metrics, and saves the
model + label encoder to the trained_models directory.

HOW TO RUN THIS SCRIPT:
    cd ai_service
    python app/training/train_prediction.py
    Expected output: accuracy score + classification report + model saved confirmation
"""

import os
import sys

# Ensure project root is on the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from app.config.settings import settings


def train() -> None:
    """Train the performance prediction model and save artefacts."""

    # ── 1. Load dataset ──────────────────────────────────────────────
    data_path = os.path.join(settings.DATA_DIR, "performance_dataset.csv")
    print(f"📂 Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Loaded {len(df)} rows, {len(df.columns)} columns")

    # ── 2. Prepare features and labels ───────────────────────────────
    feature_cols = [
        "attendance_rate",
        "task_completion_rate",
        "feedback_score",
        "productivity_score",
        "submission_rate",
    ]
    X = df[feature_cols].values
    y_raw = df["performance_label"].values

    # Encode labels: Low=0, Medium=1, High=2
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    print(f"   Label classes: {list(label_encoder.classes_)}")

    # ── 3. Train/test split ──────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train size: {len(X_train)}, Test size: {len(X_test)}")

    # ── 4. Build sklearn pipeline ────────────────────────────────────
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1,
        )),
    ])

    # ── 5. Train ─────────────────────────────────────────────────────
    print("\n🏋️ Training RandomForest pipeline...")
    pipeline.fit(X_train, y_train)

    # ── 6. Evaluate ──────────────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Accuracy: {accuracy:.4f}")
    print("\n📊 Classification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_,
    ))

    # ── 7. Save model and label encoder ──────────────────────────────
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    model_path = os.path.join(settings.MODEL_DIR, "performance_model.pkl")
    encoder_path = os.path.join(settings.MODEL_DIR, "performance_label_encoder.pkl")

    joblib.dump(pipeline, model_path)
    joblib.dump(label_encoder, encoder_path)

    print(f"\n💾 Model saved to: {model_path}")
    print(f"💾 Label encoder saved to: {encoder_path}")
    print("\n🎉 Performance prediction training complete!")


if __name__ == "__main__":
    train()
