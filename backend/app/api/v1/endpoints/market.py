"""
Market Data API Endpoints (Stage 3).

Provides four read-only market data routes:
  GET /api/v1/market/ltp           — LTP for a single symbol
  GET /api/v1/market/ltp-multiple  — LTP for the hardcoded watchlist (10 symbols)
  GET /api/v1/market/history       — Historical OHLCV candle data
  GET /api/v1/market/depth         — Level 2 market depth

All FYERS SDK logic lives in market_service.py.
Authentication is handled by fyers_auth_service (Stage 2) — not duplicated here.
"""

import logging
from fastapi import APIRouter, HTTPException, Query

import app.services.market_service as market_service
from app.schemas.market import LtpResponse, HistoryResponse, DepthResponse
from app.services.market_service import WATCHLIST_SYMBOLS

logger = logging.getLogger(__name__)
router = APIRouter()


def _handle_not_authenticated() -> None:
    """Raise 403 if FYERS auth token is not present."""
    from app.services.fyers_auth import fyers_auth_service
    if not fyers_auth_service.is_authenticated():
        raise HTTPException(
            status_code=403,
            detail="Not authenticated with FYERS. Please complete the OAuth login first.",
        )


# ---------------------------------------------------------------------------
# 1) GET /ltp  — single symbol
# ---------------------------------------------------------------------------

@router.get(
    "/ltp",
    response_model=LtpResponse,
    summary="Get LTP for a single symbol",
)
def get_ltp(
    symbol: str = Query(..., description="FYERS symbol, e.g. NSE:SBIN-EQ"),
):
    """
    Returns the last traded price for a single symbol.

    - **symbol**: Full FYERS symbol string (e.g. `NSE:SBIN-EQ`)
    """
    _handle_not_authenticated()
    try:
        items = market_service.get_ltp([symbol])
        return LtpResponse(data=items)
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /ltp: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch LTP from FYERS: {str(e)}")


# ---------------------------------------------------------------------------
# 2) GET /ltp-multiple  — hardcoded watchlist of 10 symbols
# ---------------------------------------------------------------------------

@router.get(
    "/ltp-multiple",
    response_model=LtpResponse,
    summary="Get LTP for the top 10 watchlist symbols",
)
def get_ltp_multiple():
    """
    Returns the last traded price for a pre-defined watchlist of 10 NSE symbols:
    SBIN, RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, ITC, LT, AXISBANK, BHARTIARTL.
    """
    _handle_not_authenticated()
    try:
        items = market_service.get_ltp(WATCHLIST_SYMBOLS)
        return LtpResponse(data=items)
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /ltp-multiple: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch LTP from FYERS: {str(e)}")


# ---------------------------------------------------------------------------
# 3) GET /history  — OHLCV candle data
# ---------------------------------------------------------------------------

@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get historical candle data",
)
def get_history(
    symbol: str = Query(..., description="FYERS symbol, e.g. NSE:SBIN-EQ"),
    resolution: str = Query(..., description="Candle resolution: D, W, M or minutes 1/5/15/30/60/240"),
    date_from: int = Query(..., alias="from", description="Start date as Unix epoch (seconds)"),
    date_to: int = Query(..., alias="to", description="End date as Unix epoch (seconds)"),
):
    """
    Returns OHLCV candle data for the given symbol and date range.

    - **symbol**: Full FYERS symbol string
    - **resolution**: `D` (daily), `W` (weekly), `M` (monthly), or minutes (`1`, `5`, `15`, `30`, `60`, `240`)
    - **from**: Start Unix epoch timestamp
    - **to**: End Unix epoch timestamp
    """
    _handle_not_authenticated()

    if date_from >= date_to:
        raise HTTPException(status_code=400, detail="`from` timestamp must be earlier than `to`.")

    valid_resolutions = {"D", "W", "M", "1", "2", "3", "5", "10", "15", "20", "30", "60", "120", "240"}
    if resolution not in valid_resolutions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resolution '{resolution}'. Allowed: {sorted(valid_resolutions)}",
        )

    try:
        result = market_service.get_history(symbol, resolution, date_from, date_to)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /history: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch historical data from FYERS: {str(e)}")


# ---------------------------------------------------------------------------
# 4) GET /depth  — Level 2 market depth
# ---------------------------------------------------------------------------

@router.get(
    "/depth",
    response_model=DepthResponse,
    summary="Get market depth (Level 2 order book)",
)
def get_depth(
    symbol: str = Query(..., description="FYERS symbol, e.g. NSE:SBIN-EQ"),
):
    """
    Returns Level 2 market depth (best 5 bids and asks) for the given symbol.

    - **symbol**: Full FYERS symbol string
    """
    _handle_not_authenticated()
    try:
        result = market_service.get_market_depth(symbol)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in /depth: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch market depth from FYERS: {str(e)}")
