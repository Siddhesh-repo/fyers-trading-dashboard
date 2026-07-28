from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    """
    Test GET /health alias endpoint.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "Fyers Trading Dashboard API"
    assert data["environment"] == "development"
    assert "timestamp" in data


def test_v1_health_check_endpoint():
    """
    Test GET /api/v1/health versioned endpoint.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "Fyers Trading Dashboard API"
    assert data["environment"] == "development"
    assert "timestamp" in data
