import os
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from app.services.performance_predictor import MODEL_PATH, FEATURE_NAMES

def test_xgboost_performance_model():
    # 1. Ensure the model exists
    assert os.path.exists(MODEL_PATH), f"Model file not found at {MODEL_PATH}"
    
    # 2. Load the trained model
    model = joblib.load(MODEL_PATH)
    assert model is not None, "Loaded model is None"
    
    # 3. Load the synthetic dataset
    data_dir = os.path.join(os.path.dirname(__file__), "..", "app", "data")
    csv_path = os.path.join(data_dir, "synthetic_intern_data.csv")
    assert os.path.exists(csv_path), f"Synthetic CSV not found at {csv_path}"
    
    df = pd.read_csv(csv_path)
    assert len(df) >= 1000, f"Expected at least 1,000 rows, got {len(df)}"
    
    # 4. Extract features and labels
    X = df[FEATURE_NAMES]
    y = df["performance_label"]
    
    # 5. Split 80/20 train/test
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 6. Evaluate predictions
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1_scores = f1_score(y_test, y_pred, average=None)
    f1_at_risk = f1_scores[0]
    
    # Assert criteria
    assert accuracy >= 0.80, f"Model accuracy is too low: {accuracy:.4f}"
    assert f1_at_risk >= 0.75, f"At-risk class F1-score is too low: {f1_at_risk:.4f}"
