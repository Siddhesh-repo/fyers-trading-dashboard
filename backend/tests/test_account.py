from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_account_unauthenticated_returns_403():
    """
    Ensure all account endpoints return 403 Forbidden when unauthenticated.
    """
    endpoints = [
        "/api/v1/account/funds",
        "/api/v1/account/holdings",
        "/api/v1/account/positions",
        "/api/v1/account/orders",
    ]

    for path in endpoints:
        response = client.get(path)
        assert response.status_code == 403, f"Expected 403 for {path}, got {response.status_code}"
