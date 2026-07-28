"""
Account Information Service.

Sole interface to the FYERS SDK for account data: Funds, Holdings, Positions,
and Order Book. Uses get_fyers_client() from fyers_auth — no auth logic is
duplication here.
"""

import logging
from typing import List, Dict, Any

from app.services.fyers_auth import get_fyers_client
from app.schemas.account import (
    FundsResponse, FundLimitItem,
    HoldingsResponse, HoldingItem,
    PositionsResponse, PositionItem,
    OrdersResponse, OrderItem
)

logger = logging.getLogger(__name__)



def get_funds() -> FundsResponse:
    """
    Fetch account funds / balance.
    FYERS returns a list of fund items under 'fund_limit'.
    """
    fyers = get_fyers_client()
    logger.info("Fetching account funds")

    response = fyers.funds()

    if response.get("s") != "ok":
        msg = response.get("message", "Failed to fetch funds from FYERS")
        logger.error("FYERS funds error: %s | response: %s", msg, response)
        raise ValueError(msg)

    fund_limits = response.get("fund_limit", [])

    available_balance = 0.0
    utilized_balance = 0.0
    items: List[FundLimitItem] = []

    for item in fund_limits:
        title = item.get("title", "")
        amount = float(item.get("equityAmount", item.get("numVal", 0.0)))

        items.append(FundLimitItem(title=title, amount=amount))

        title_lower = title.lower()
        if "available" in title_lower or "clear balance" in title_lower or id_is_available(item):
            available_balance = max(available_balance, amount)
        elif "utilized" in title_lower or "used" in title_lower or "margin used" in title_lower:
            utilized_balance += amount

    # Fallback parsing if available_balance wasn't specifically tagged
    if available_balance == 0.0 and fund_limits:
        # FYERS typically puts Total Limit / Net Available in the first or second item
        available_balance = float(fund_limits[0].get("numVal", 0.0))

    return FundsResponse(
        available_balance=available_balance,
        utilized_balance=utilized_balance,
        limits=items,
    )


def id_is_available(item: Dict[str, Any]) -> bool:
    """Helper to check if limit item id represents available margin."""
    item_id = item.get("id", 0)
    # FYERS limit IDs for Total Balance / Net Available are usually 1 or 10
    return item_id in (1, 10)


def get_holdings() -> HoldingsResponse:
    """
    Fetch user equity holdings.
    """
    fyers = get_fyers_client()
    logger.info("Fetching user holdings")

    response = fyers.holdings()

    if response.get("s") != "ok":
        msg = response.get("message", "Failed to fetch holdings from FYERS")
        logger.error("FYERS holdings error: %s | response: %s", msg, response)
        raise ValueError(msg)

    raw_holdings = response.get("holdings", [])
    holdings_list: List[HoldingItem] = []

    for h in raw_holdings:
        qty = int(h.get("quantity", h.get("holdingType", 0)))
        cost_price = float(h.get("costPrice", h.get("avgPrice", 0.0)))
        curr_price = float(h.get("ltp", h.get("marketVal", 0.0) / qty if qty > 0 else 0.0))
        curr_val = float(h.get("marketVal", qty * curr_price))
        pnl = float(h.get("pl", curr_val - (qty * cost_price)))

        holdings_list.append(
            HoldingItem(
                holding_id=str(h.get("id", h.get("symbol", ""))),
                symbol=h.get("symbol", ""),
                quantity=qty,
                cost_price=cost_price,
                current_price=curr_price,
                current_value=curr_val,
                pnl=pnl,
            )
        )

    return HoldingsResponse(
        total_holdings=len(holdings_list),
        data=holdings_list,
    )


def get_positions() -> PositionsResponse:
    """
    Fetch user net positions.
    """
    fyers = get_fyers_client()
    logger.info("Fetching user positions")

    response = fyers.positions()

    if response.get("s") != "ok":
        msg = response.get("message", "Failed to fetch positions from FYERS")
        logger.error("FYERS positions error: %s | response: %s", msg, response)
        raise ValueError(msg)

    raw_positions = response.get("netPositions", response.get("positionDetails", []))
    positions_list: List[PositionItem] = []

    for p in raw_positions:
        qty = int(p.get("netQty", p.get("qty", 0)))
        side_code = int(p.get("side", 1))
        side = "BUY" if side_code == 1 or qty > 0 else "SELL"
        avg_price = float(p.get("avgPrice", p.get("buyAvg", 0.0)))
        ltp = float(p.get("ltp", 0.0))
        pnl = float(p.get("pl", p.get("unrealized_profit", 0.0)))

        positions_list.append(
            PositionItem(
                position_id=str(p.get("id", p.get("symbol", ""))),
                symbol=p.get("symbol", ""),
                side=side,
                quantity=abs(qty),
                avg_price=avg_price,
                current_price=ltp,
                pnl=pnl,
            )
        )

    return PositionsResponse(
        total_positions=len(positions_list),
        data=positions_list,
    )


def get_orders() -> OrdersResponse:
    """
    Fetch user order book.
    """
    fyers = get_fyers_client()
    logger.info("Fetching user order book")

    response = fyers.orderbook()

    if response.get("s") != "ok":
        msg = response.get("message", "Failed to fetch order book from FYERS")
        logger.error("FYERS orderbook error: %s | response: %s", msg, response)
        raise ValueError(msg)

    raw_orders = response.get("orderBook", [])
    orders_list: List[OrderItem] = []

    # Map FYERS numeric order types and statuses to readable strings
    type_map = {1: "LIMIT", 2: "MARKET", 3: "STOP_MARKET", 4: "STOP_LIMIT"}
    status_map = {1: "CANCELLED", 2: "FILLED", 4: "TRANSIT", 5: "REJECTED", 6: "PENDING"}

    for o in raw_orders:
        side_code = int(o.get("side", 1))
        side = "BUY" if side_code == 1 else "SELL"

        type_code = int(o.get("type", 2))
        order_type = type_map.get(type_code, str(type_code))

        status_code = int(o.get("status", 6))
        status = status_map.get(status_code, str(status_code))

        orders_list.append(
            OrderItem(
                order_id=str(o.get("id", "")),
                symbol=o.get("symbol", ""),
                side=side,
                quantity=int(o.get("qty", o.get("filledQty", 0))),
                order_type=order_type,
                status=status,
                timestamp=str(o.get("orderDateTime", o.get("createTime", "—"))),
            )
        )

    return OrdersResponse(
        total_orders=len(orders_list),
        data=orders_list,
    )
