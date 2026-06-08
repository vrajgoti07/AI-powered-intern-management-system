from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_predict_performance_xgboost_format():
    payload = {
        "internId": "test-intern-123",
        "features": {
            "attendance_rate": 0.95,
            "task_completion_rate": 0.90,
            "avg_task_rating": 4.5,
            "days_since_last_task": 1,
            "communication_score": 4.2,
            "skill_match_score": 0.8,
            "week_number": 5
        }
    }
    response = client.post("/api/ai/predict-performance", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "prediction" in res_data
    assert "confidence" in res_data


def test_predict_performance_ridge_format():
    payload = {
        "attendance_rate": 0.95,
        "task_completion_rate": 0.90,
        "feedback_sentiment_score": 0.8,
        "productivity_score": 0.90
    }
    response = client.post("/api/ai/predict-performance", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "predicted_performance_grade" in res_data
    assert "predicted_score" in res_data


def test_predict_performance_rf_format():
    payload = {
        "attendance_rate": 0.95,
        "task_completion_rate": 0.90,
        "feedback_score": 4.5,
        "productivity_score": 0.90,
        "submission_rate": 0.95
    }
    response = client.post("/api/ai/predict-performance", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "data" in res_data


def test_ranking_snake_case():
    payload = {
        "interns": [
            {
                "intern_id": "i1",
                "name": "Alice",
                "attendance_rate": 0.95,
                "task_completion_rate": 0.90,
                "avg_task_rating": 4.5,
                "communication_score": 4.0,
                "skill_growth_score": 0.8
            }
        ]
    }
    response = client.post("/api/ai/ranking", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data) == 1
    assert res_data[0]["name"] == "Alice"
    assert res_data[0]["totalScore"] > 0


def test_ranking_camel_case():
    payload = {
        "interns": [
            {
                "internId": "i2",
                "name": "Bob",
                "attendance": 95.0,
                "task_completion": 90.0,
                "task_quality": 4.5,
                "communication": 4.0,
                "skill_growth": 4.0
            }
        ]
    }
    response = client.post("/api/ai/ranking", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data) == 1
    assert res_data[0]["name"] == "Bob"
