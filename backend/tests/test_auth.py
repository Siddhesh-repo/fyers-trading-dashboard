from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_status_endpoint():
    """
    Test GET /api/auth/status and /api/v1/auth/status endpoints.
    """
    response = client.get("/api/auth/status")
    assert response.status_code == 200
    data = response.json()
    assert "authenticated" in data
    assert data["authenticated"] is False

    response_v1 = client.get("/api/v1/auth/status")
    assert response_v1.status_code == 200
    assert response_v1.json()["authenticated"] is False
