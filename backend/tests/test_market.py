from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_market_unauthenticated_returns_403():
    """
    Ensure all market data endpoints return 403 Forbidden when not authenticated.
    """
    endpoints = [
        "/api/v1/market/ltp?symbol=NSE:SBIN-EQ",
        "/api/v1/market/ltp-multiple",
        "/api/v1/market/history?symbol=NSE:SBIN-EQ&resolution=D&from=1000000000&to=1000000100",
        "/api/v1/market/depth?symbol=NSE:SBIN-EQ",
    ]

    for path in endpoints:
        response = client.get(path)
        assert response.status_code == 403, f"Expected 403 for {path}, got {response.status_code}"
