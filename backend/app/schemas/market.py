"""
Pydantic schemas for the Market Data module (Stage 3).

These models define the shape of all request inputs and API responses for
LTP, historical candle data, and market depth endpoints.
"""

from typing import List
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# LTP (Last Traded Price)
# ---------------------------------------------------------------------------

class LtpItem(BaseModel):
    """Single symbol LTP entry."""
    symbol: str = Field(..., description="FYERS symbol format, e.g. NSE:SBIN-EQ")
    ltp: float = Field(..., description="Last traded price")


class LtpResponse(BaseModel):
    """Response model for LTP endpoints."""
    data: List[LtpItem]


# ---------------------------------------------------------------------------
# Historical Candle Data
# ---------------------------------------------------------------------------

class CandleItem(BaseModel):
    """Single OHLCV candle."""
    timestamp: int = Field(..., description="Unix epoch timestamp")
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoryResponse(BaseModel):
    """Response model for historical candle data."""
    symbol: str
    resolution: str
    candles: List[CandleItem]


# ---------------------------------------------------------------------------
# Market Depth
# ---------------------------------------------------------------------------

class DepthLevel(BaseModel):
    """Single bid/ask level in the order book."""
    price: float
    quantity: int
    orders: int = 0


class DepthResponse(BaseModel):
    """Response model for market depth."""
    symbol: str
    ltp: float = 0.0
    bids: List[DepthLevel]
    asks: List[DepthLevel]
