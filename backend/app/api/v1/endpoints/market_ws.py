"""
WebSocket API Endpoint for Live Market Data (Stage 5).

Exposes:
  /ws/market (and /api/v1/ws/market)
"""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_service import manager, fyers_ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/market")
async def websocket_market_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data streaming.
    Streams tick updates for:
      - NSE:SBIN-EQ
      - NSE:RELIANCE-EQ
      - NSE:TCS-EQ
      - NSE:INFY-EQ
      - NSE:HDFCBANK-EQ
    """
    # Register running asyncio event loop with ConnectionManager
    manager.set_event_loop(asyncio.get_running_loop())

    # Try to start FYERS DataSocket if token is available and not already started
    if not fyers_ws_manager.is_connected:
        fyers_ws_manager.start_socket()

    await manager.connect(websocket)

    try:
        while True:
            # Keep connection open and listen for client messages / pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("WebSocket endpoint error: %s", e)
        manager.disconnect(websocket)
