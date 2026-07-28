import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.api.v1.endpoints.health import get_health_status
from app.api.v1.endpoints.market_ws import websocket_market_endpoint

# Initialize centralized logging configuration
setup_logging()
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for startup and shutdown events.
    """
    logger.info("Initializing %s in [%s] environment...", settings.APP_NAME, settings.APP_ENV)
    yield
    logger.info("Shutting down %s...", settings.APP_NAME)


# Create FastAPI application instance
app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade API backend for Fyers Trading Dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Alias root level /health endpoint for direct probes
app.add_api_route("/health", get_health_status, methods=["GET"], tags=["Health Checks"])

# Mount API v1 router under /api/v1 prefix and /api prefix for compatibility
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

app.add_api_websocket_route("/ws/market", websocket_market_endpoint)
