from fastapi.testclient import TestClient
from app.main import app
from app.services.websocket_service import BASE_PRICES

client = TestClient(app)


def test_websocket_market_endpoint_connect():
    """
    Test WebSocket handshake, initial tick JSON delivery, and ping/pong communication on /ws/market.
    """
    with client.websocket_connect("/ws/market") as websocket:
        # Drain initial cached ticks (5 symbols)
        received_symbols = set()
        for _ in range(len(BASE_PRICES)):
            data = websocket.receive_json()
            assert "symbol" in data
            assert "ltp" in data
            assert "timestamp" in data
            received_symbols.add(data["symbol"])

        assert len(received_symbols) == len(BASE_PRICES)

        # Send ping to verify bidirectional socket communication
        websocket.send_text("ping")
        message = websocket.receive_text()
        assert message == "pong"
