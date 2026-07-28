"""
Pydantic schemas for the Account Information module (Stage 4).

Defines response structures for funds, holdings, positions, and orders.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Funds
# ---------------------------------------------------------------------------

class FundLimitItem(BaseModel):
    title: str
    amount: float


class FundsResponse(BaseModel):
    """Available and utilized account balances."""
    available_balance: float = Field(..., description="Available margin/balance for trading")
    utilized_balance: float = Field(..., description="Used margin/balance")
    currency: str = "INR"
    limits: List[FundLimitItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Holdings
# ---------------------------------------------------------------------------

class HoldingItem(BaseModel):
    """Single stock holding."""
    holding_id: Optional[str] = None
    symbol: str = Field(..., description="FYERS symbol string, e.g. NSE:SBIN-EQ")
    quantity: int = Field(..., description="Quantity held")
    cost_price: float = Field(..., description="Average buy price")
    current_price: float = Field(0.0, description="Current market price")
    current_value: float = Field(0.0, description="Total current value")
    pnl: float = Field(0.0, description="Profit & Loss")


class HoldingsResponse(BaseModel):
    """List of holdings."""
    total_holdings: int
    data: List[HoldingItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------------

class PositionItem(BaseModel):
    """Open or closed position."""
    position_id: Optional[str] = None
    symbol: str = Field(..., description="FYERS symbol string")
    side: str = Field(..., description="BUY or SELL")
    quantity: int = Field(..., description="Net position quantity")
    avg_price: float = Field(..., description="Average entry price")
    current_price: float = Field(0.0, description="Current market price")
    pnl: float = Field(0.0, description="Unrealized / Total P&L")


class PositionsResponse(BaseModel):
    """List of net positions."""
    total_positions: int
    data: List[PositionItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Order Book
# ---------------------------------------------------------------------------

class OrderItem(BaseModel):
    """Single order entry in the order book."""
    order_id: str
    symbol: str
    side: str = Field(..., description="BUY or SELL")
    quantity: int
    order_type: str = Field(..., description="LIMIT, MARKET, STOP, etc.")
    status: str = Field(..., description="SUBMITTED, FILLED, CANCELLED, REJECTED")
    timestamp: str = Field(..., description="Order creation timestamp")


class OrdersResponse(BaseModel):
    """List of orders."""
    total_orders: int
    data: List[OrderItem] = Field(default_factory=list)
