"""
Account Information API Endpoints (Stage 4).

Provides 4 read-only account endpoints:
  GET /api/v1/account/funds       — Account balance and limits
  GET /api/v1/account/holdings    — Equity holdings
  GET /api/v1/account/positions   — Open and closed net positions
  GET /api/v1/account/orders      — Order book history

All SDK calls are delegated to account_service.py.
"""

import logging
from fastapi import APIRouter, HTTPException

import app.services.account_service as account_service
from app.schemas.account import (
    FundsResponse, HoldingsResponse, PositionsResponse, OrdersResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _handle_not_authenticated() -> None:
    """Raise 403 if FYERS auth token is not present."""
    from app.services.fyers_auth import fyers_auth_service
    if not fyers_auth_service.is_authenticated():
        raise HTTPException(
            status_code=403,
            detail="Not authenticated with FYERS. Please complete OAuth login first.",
        )


@router.get(
    "/funds",
    response_model=FundsResponse,
    summary="Get account balance and funds summary",
)
def get_funds():
    """Returns available balance, utilized balance, and fund limits."""
    _handle_not_authenticated()
    try:
        return account_service.get_funds()
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /account/funds: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch funds from FYERS: {str(e)}")


@router.get(
    "/holdings",
    response_model=HoldingsResponse,
    summary="Get user equity holdings",
)
def get_holdings():
    """Returns current stock holdings."""
    _handle_not_authenticated()
    try:
        return account_service.get_holdings()
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /account/holdings: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch holdings from FYERS: {str(e)}")


@router.get(
    "/positions",
    response_model=PositionsResponse,
    summary="Get user positions",
)
def get_positions():
    """Returns current net positions."""
    _handle_not_authenticated()
    try:
        return account_service.get_positions()
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /account/positions: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch positions from FYERS: {str(e)}")


@router.get(
    "/orders",
    response_model=OrdersResponse,
    summary="Get order book history",
)
def get_orders():
    """Returns the user's order book history."""
    _handle_not_authenticated()
    try:
        return account_service.get_orders()
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /account/orders: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch order book from FYERS: {str(e)}")
