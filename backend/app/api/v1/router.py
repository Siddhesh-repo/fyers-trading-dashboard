from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, market, account, market_ws

api_router = APIRouter()

# Register modular sub-routers
api_router.include_router(health.router, tags=["Health Checks"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(market.router, prefix="/market", tags=["Market Data"])
api_router.include_router(account.router, prefix="/account", tags=["Account Information"])
api_router.include_router(market_ws.router, tags=["Live WebSockets"])
