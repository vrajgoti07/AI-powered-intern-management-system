from fastapi.testclient import TestClient
from app.main import app

def test_clean_double_slashes():
    with TestClient(app) as client:
        # Test GET //api/ai/health
        response = client.get("http://testserver//api/ai/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

def test_evaluate_risks_double_slash():
    with TestClient(app) as client:
        # Test POST //api/ai/risks/evaluate
        payload = {
            "interns": [
                {
                    "internId": "test-1",
                    "name": "Test Intern",
                    "attendance": 90.0,
                    "days_since_last_task": 1,
                    "overdue_high_priority_tasks": 0,
                    "workload_score": 10.0,
                    "days_since_mentor_interaction": 1
                }
            ]
        }
        response = client.post("http://testserver//api/ai/risks/evaluate", json=payload)
        # Even if it errors on something else or returns 200/500, it shouldn't be 404
        assert response.status_code != 404
