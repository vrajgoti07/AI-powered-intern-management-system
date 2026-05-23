"""
Training script for the Sentiment Analysis pipeline validation.

Verifies that the pre-trained DistilBERT sentiment pipeline
(distilbert-base-uncased-finetuned-sst-2-english) loads correctly
and runs test predictions on sample feedback texts.

No fine-tuning is performed — this script simply validates readiness
and saves a config file for the service module.

HOW TO RUN THIS SCRIPT:
    cd ai_service
    python app/training/train_sentiment.py
    Expected output: test predictions + pipeline ready confirmation
"""

import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pandas as pd
from transformers import pipeline

from app.config.settings import settings


SAMPLE_TEXTS = [
    "Shows strong initiative and consistently delivers high-quality work.",
    "Poor attendance record and frequently misses standup meetings.",
    "Average performance overall. Completes tasks but rarely goes beyond.",
    "Excellent communication skills and team collaboration. Highly recommended.",
    "Struggles with complex problem solving. Needs additional mentoring.",
]


def train() -> None:
    """Validate the sentiment analysis pipeline and save config."""

    # ── 1. Load sentiment pipeline ───────────────────────────────────
    print("🧠 Loading DistilBERT sentiment pipeline...")
    print("   Model: distilbert-base-uncased-finetuned-sst-2-english")
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        device=-1,  # Force CPU
    )
    print("   ✅ Pipeline loaded successfully!")

    # ── 2. Run test predictions ──────────────────────────────────────
    print("\n📊 Running test predictions on sample feedback:")
    print("-" * 70)

    results = []
    for text in SAMPLE_TEXTS:
        prediction = sentiment_pipeline(text)[0]
        label = prediction["label"]
        score = prediction["score"]
        print(f"   [{label:8s}] (conf: {score:.4f}) → {text[:60]}...")
        results.append({"text": text, "label": label, "score": round(score, 4)})

    print("-" * 70)

    # ── 3. Validate with feedback dataset ────────────────────────────
    data_path = os.path.join(settings.DATA_DIR, "feedback_dataset.csv")
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        print(f"\n📂 Validated against feedback_dataset.csv ({len(df)} rows)")

        # Quick distribution check
        sample_preds = sentiment_pipeline(df["feedback_text"].head(10).tolist())
        pos_count = sum(1 for p in sample_preds if p["label"] == "POSITIVE")
        neg_count = sum(1 for p in sample_preds if p["label"] == "NEGATIVE")
        print(f"   First 10 rows: {pos_count} POSITIVE, {neg_count} NEGATIVE")

    # ── 4. Save config ───────────────────────────────────────────────
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    config = {
        "model_name": "distilbert-base-uncased-finetuned-sst-2-english",
        "task": "sentiment-analysis",
        "device": "cpu",
        "test_results": results,
        "status": "ready",
    }

    config_path = os.path.join(settings.MODEL_DIR, "sentiment_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"\n💾 Config saved to: {config_path}")
    print("\n🎉 Sentiment pipeline validation complete — ready for inference!")


if __name__ == "__main__":
    train()
