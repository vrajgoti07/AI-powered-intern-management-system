import os
import sys
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, f1_score

# Ensure project root is on the path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.services.performance_predictor import MODEL_PATH, FEATURE_NAMES, predictor_instance

def train_and_save():
    # 1. Load synthetic data
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    csv_path = os.path.join(data_dir, "synthetic_intern_data.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: Synthetic CSV not found at: {csv_path}")
        sys.exit(1)
        
    print(f"Loading synthetic dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"   Loaded {len(df)} rows")
    
    # 2. Extract features and label
    X = df[FEATURE_NAMES]
    y = df["performance_label"]
    
    # 3. Train/test split (80% train, 20% test, stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train size: {len(X_train)}, Test size: {len(X_test)}")
    
    # 4. Initialize XGBClassifier
    xgb_model = xgb.XGBClassifier(
        objective="multi:softprob",
        num_class=3,
        random_state=42,
        eval_metric="mlogloss"
    )
    
    # 5. Param grid for GridSearchCV
    param_grid = {
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.1, 0.2],
        'n_estimators': [50, 100, 200]
    }
    
    print("Running GridSearchCV over hyperparameters...")
    grid_search = GridSearchCV(
        xgb_model,
        param_grid,
        cv=3,
        scoring='accuracy',
        n_jobs=-1
    )
    
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best cross-validation accuracy: {grid_search.best_score_:.4f}")
    
    # 6. Evaluate on held-out test split
    y_pred = best_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1_at_risk = f1_score(y_test, y_pred, average=None)[0]
    
    print(f"\nFinal Test Accuracy: {accuracy:.4f}")
    print(f"F1-score for 'at-risk' class (Class 0): {f1_at_risk:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['at-risk', 'average', 'high-performer']))
    
    # Save the model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")
    
    # Use predictor instance to generate feature importance plot
    predictor_instance.model = best_model
    predictor_instance._generate_feature_importance_plot()
    print(f"Feature importance plot generated at: {os.path.join(data_dir, 'feature_importance.png')}")
    
    print("\nXGBoost model training and deployment complete!")

if __name__ == "__main__":
    train_and_save()
