"""
WebSocket Service (Stage 5).

Manages:
1. Connection to the official FYERS DataSocket (fyers_apiv3.FyersWebsocket.data_ws.FyersDataSocket).
2. Subscription to requested symbols:
   - NSE:SBIN-EQ
   - NSE:RELIANCE-EQ
   - NSE:TCS-EQ
   - NSE:INFY-EQ
   - NSE:HDFCBANK-EQ
3. ConnectionManager for streaming real-time JSON ticks to connected FastAPI WebSocket clients.
"""

import asyncio
import logging
import threading
from datetime import datetime
from typing import Any

from fastapi import WebSocket

from app.core.config import settings
from app.services.fyers_auth import fyers_auth_service

logger = logging.getLogger(__name__)

# Subscribed symbols for live streaming
SUBSCRIBED_SYMBOLS: list[str] = [
    "NSE:SBIN-EQ",
    "NSE:RELIANCE-EQ",
    "NSE:TCS-EQ",
    "NSE:INFY-EQ",
    "NSE:HDFCBANK-EQ",
]

# Initial reference prices for fallback display
BASE_PRICES: dict[str, float] = {
    "NSE:SBIN-EQ": 845.50,
    "NSE:RELIANCE-EQ": 3020.10,
    "NSE:TCS-EQ": 4210.75,
    "NSE:INFY-EQ": 1825.30,
    "NSE:HDFCBANK-EQ": 1640.20,
}


class ConnectionManager:
    """Manages active FastAPI WebSocket client connections and broadcasts live ticks."""

    def __init__(self):
        self.active_connections: set[WebSocket] = set()
        self.latest_ticks: dict[str, dict[str, Any]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None
        self._init_default_ticks()

    def _init_default_ticks(self):
        """Initialize default tick cache so clients see instant price data on connect."""
        now_str = datetime.now().strftime("%H:%M:%S")
        for sym, price in BASE_PRICES.items():
            self.latest_ticks[sym] = {
                "symbol": sym,
                "ltp": price,
                "prev_close": price,
                "change": 0.0,
                "timestamp": now_str,
                "source": "initial",
            }

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("New WebSocket client connected. Total clients: %d", len(self.active_connections))

        # Instantly send cached latest ticks to newly connected client
        for tick in self.latest_ticks.values():
            try:
                await websocket.send_json(tick)
            except Exception as e:
                logger.error("Error sending initial tick to client: %s", e)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info("WebSocket client disconnected. Remaining clients: %d", len(self.active_connections))

    async def broadcast_tick(self, tick_data: dict[str, Any]):
        """Broadcast tick JSON message to all active WebSocket clients."""
        symbol = tick_data.get("symbol")
        if symbol:
            self.latest_ticks[symbol] = tick_data

        if not self.active_connections:
            return

        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(tick_data)
            except Exception:
                disconnected.add(connection)

        for conn in disconnected:
            self.active_connections.discard(conn)

    def update_tick_from_thread(self, tick_data: dict[str, Any]):
        """Thread-safe method to schedule tick broadcasting onto the asyncio event loop."""
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast_tick(tick_data), self._loop)


manager = ConnectionManager()


class FyersWebsocketManager:
    """Manages the lifecycle of the FYERS FyersDataSocket background connection."""

    def __init__(self):
        self.fyers_ws = None
        self.is_connected = False
        self._thread: threading.Thread | None = None

    def start_socket(self):
        """Starts the FYERS DataSocket in a background thread."""
        token = fyers_auth_service.get_access_token()
        if not token:
            logger.warning("No FYERS access token found. FYERS DataSocket will not connect until user logs in.")
            return False

        try:
            from fyers_apiv3.FyersWebsocket import data_ws

            # Format auth token: client_id:access_token
            formatted_token = f"{settings.FYERS_CLIENT_ID}:{token}"

            def on_connect():
                logger.info("FYERS DataSocket connected successfully.")
                self.is_connected = True
                # Subscribe to required symbols
                if self.fyers_ws:
                    self.fyers_ws.subscribe(symbols=SUBSCRIBED_SYMBOLS, data_type="SymbolUpdate")

            def on_message(message):
                logger.debug("FYERS DataSocket tick: %s", message)
                try:
                    self._parse_and_broadcast(message)
                except Exception as e:
                    logger.error("Error parsing FYERS tick message: %s", e)

            def on_error(message):
                logger.error("FYERS DataSocket error: %s", message)

            def on_close(message):
                logger.info("FYERS DataSocket closed: %s", message)
                self.is_connected = False

            self.fyers_ws = data_ws.FyersDataSocket(
                access_token=formatted_token,
                log_path=None,
                litemode=False,
                reconnect=True,
                on_connect=on_connect,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
            )

            # Connect in background thread
            self._thread = threading.Thread(target=self.fyers_ws.connect, daemon=True)
            self._thread.start()
            logger.info("FYERS DataSocket thread started.")
            return True

        except Exception as e:
            logger.error("Failed to initialize FYERS DataSocket: %s", e)
            return False

    def _parse_and_broadcast(self, msg: Any):
        """Extract symbol, ltp, timestamp from FYERS tick and schedule broadcast."""
        if not isinstance(msg, dict):
            return

        symbol = msg.get("symbol") or msg.get("n")
        ltp = msg.get("ltp") or msg.get("v", {}).get("lp")

        if symbol and ltp is not None:
            ltp = float(ltp)
            prev_close = float(msg.get("prev_close_price", BASE_PRICES.get(symbol, ltp)))
            change = ltp - prev_close

            now_str = datetime.now().strftime("%H:%M:%S")

            tick_payload = {
                "symbol": symbol,
                "ltp": ltp,
                "prev_close": prev_close,
                "change": round(change, 2),
                "timestamp": now_str,
                "source": "fyers_ws",
            }
            manager.update_tick_from_thread(tick_payload)


fyers_ws_manager = FyersWebsocketManager()
