"""
Market Data Service.

Sole interface to the FYERS SDK for market data. Authentication is provided
by the shared get_fyers_client() factory in fyers_auth — never duplicated here.
"""

import logging
from typing import List

from app.services.fyers_auth import get_fyers_client
from app.schemas.market import LtpItem, CandleItem, HistoryResponse, DepthLevel, DepthResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Hardcoded watchlist for the "Top 10 Symbols" endpoint
# ---------------------------------------------------------------------------
WATCHLIST_SYMBOLS: List[str] = [
    "NSE:SBIN-EQ",
    "NSE:RELIANCE-EQ",
    "NSE:TCS-EQ",
    "NSE:INFY-EQ",
    "NSE:HDFCBANK-EQ",
    "NSE:ICICIBANK-EQ",
    "NSE:ITC-EQ",
    "NSE:LT-EQ",
    "NSE:AXISBANK-EQ",
    "NSE:BHARTIARTL-EQ",
]




# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------


def get_ltp(symbols: List[str]) -> List[LtpItem]:
    """
    Fetch the Last Traded Price for one or more FYERS symbols.

    Args:
        symbols: List of FYERS-format symbol strings, e.g. ["NSE:SBIN-EQ"]

    Returns:
        List of LtpItem objects.

    Raises:
        RuntimeError: If not authenticated.
        ValueError:   If the FYERS API returns an error response.
    """
    fyers = get_fyers_client()
    symbol_csv = ",".join(symbols)

    logger.info("Fetching LTP for symbols: %s", symbol_csv)
    response = fyers.quotes(data={"symbols": symbol_csv})

    if response.get("s") != "ok":
        msg = response.get("message", "Unknown error from FYERS quotes API")
        logger.error("FYERS quotes error: %s | response: %s", msg, response)
        raise ValueError(msg)

    results: List[LtpItem] = []
    for item in response.get("d", []):
        v = item.get("v", {})
        results.append(
            LtpItem(
                symbol=item.get("n", ""),
                ltp=float(v.get("lp", 0.0)),
            )
        )

    return results


def get_history(
    symbol: str,
    resolution: str,
    date_from: int,
    date_to: int,
) -> HistoryResponse:
    """
    Fetch historical OHLCV candle data from FYERS.

    Args:
        symbol:     FYERS symbol, e.g. "NSE:SBIN-EQ"
        resolution: Candle resolution — "D" (daily), "W" (weekly),
                    "M" (monthly), or integer minutes: "1","2","3","5","10",
                    "15","20","30","60","120","240"
        date_from:  Start date as Unix epoch (seconds)
        date_to:    End date as Unix epoch (seconds)

    Returns:
        HistoryResponse with list of CandleItem.

    Raises:
        RuntimeError: If not authenticated.
        ValueError:   If FYERS returns an error.
    """
    fyers = get_fyers_client()

    payload = {
        "symbol": symbol,
        "resolution": resolution,
        "date_format": "0",         # 0 = epoch, 1 = yyyy-mm-dd
        "range_from": str(date_from),
        "range_to": str(date_to),
        "cont_flag": "1",
    }

    logger.info("Fetching history: %s | resolution=%s | %s -> %s", symbol, resolution, date_from, date_to)
    response = fyers.history(data=payload)

    if response.get("s") != "ok":
        msg = response.get("message", "Unknown error from FYERS history API")
        logger.error("FYERS history error: %s | response: %s", msg, response)
        raise ValueError(msg)

    candles: List[CandleItem] = []
    for row in response.get("candles", []):
        # FYERS returns [timestamp, open, high, low, close, volume]
        candles.append(
            CandleItem(
                timestamp=int(row[0]),
                open=float(row[1]),
                high=float(row[2]),
                low=float(row[3]),
                close=float(row[4]),
                volume=int(row[5]),
            )
        )

    return HistoryResponse(symbol=symbol, resolution=resolution, candles=candles)


def get_market_depth(symbol: str) -> DepthResponse:
    """
    Fetch Level 2 market depth for a symbol.

    Args:
        symbol: FYERS symbol, e.g. "NSE:SBIN-EQ"

    Returns:
        DepthResponse with bids and asks lists.

    Raises:
        RuntimeError: If not authenticated.
        ValueError:   If FYERS returns an error.
    """
    fyers = get_fyers_client()

    logger.info("Fetching market depth for: %s", symbol)
    response = fyers.depth(data={"symbol": symbol, "ohlcv_flag": "1"})

    if response.get("s") != "ok":
        msg = response.get("message", "Unknown error from FYERS depth API")
        logger.error("FYERS depth error: %s | response: %s", msg, response)
        raise ValueError(msg)

    # FYERS depth response nests data under the symbol key
    depth_data = response.get("d", {}).get(symbol, {})

    ltp = float(depth_data.get("ltp", 0.0))

    bids: List[DepthLevel] = []
    for level in depth_data.get("bids", []):
        bids.append(
            DepthLevel(
                price=float(level.get("price", 0.0)),
                quantity=int(level.get("volume", 0)),
                orders=int(level.get("ord", 0)),
            )
        )

    asks: List[DepthLevel] = []
    for level in depth_data.get("ask", []):
        asks.append(
            DepthLevel(
                price=float(level.get("price", 0.0)),
                quantity=int(level.get("volume", 0)),
                orders=int(level.get("ord", 0)),
            )
        )

    return DepthResponse(symbol=symbol, ltp=ltp, bids=bids, asks=asks)
