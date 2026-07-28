from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Schema for health check endpoint response.
    """
    status: str = Field(..., description="Current status of backend API ('healthy')")
    app_name: str = Field(..., description="Name of the backend service")
    environment: str = Field(..., description="Deployment environment (e.g. development, production)")
    timestamp: datetime = Field(..., description="UTC Timestamp of response generation")
