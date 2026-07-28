from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import logging
from app.services.fyers_auth import fyers_auth_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

class AuthStatusResponse(BaseModel):
    authenticated: bool

class LoginUrlResponse(BaseModel):
    login_url: str

@router.get("/login", response_model=LoginUrlResponse, summary="Generate FYERS Login URL")
def login():
    """Returns the FYERS OAuth login URL."""
    try:
        url = fyers_auth_service.generate_login_url()
        return LoginUrlResponse(login_url=url)
    except ValueError:
        raise HTTPException(status_code=500, detail="FYERS credentials not configured properly")
    except Exception as e:
        logger.error(f"Failed to generate login URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate login URL")

@router.get("/callback", summary="FYERS OAuth Callback")
def callback(auth_code: str = None, s: str = None, code: str = None, state: str = None):
    """
    Callback endpoint that FYERS redirects to.
    Expects 'auth_code' in the query string.
    """
    # Base frontend URL for redirection
    frontend_url = "http://localhost:5173"
    
    # FYERS can return auth_code, or status 's' and code/message if error
    if s == "error" or not auth_code:
        logger.error(f"FYERS authentication failed or auth_code missing. Code: {code}")
        return RedirectResponse(url=f"{frontend_url}/?error=auth_failed")

    success = fyers_auth_service.generate_access_token(auth_code)
    
    if success:
        return RedirectResponse(url=f"{frontend_url}/")
    else:
        return RedirectResponse(url=f"{frontend_url}/?error=token_generation_failed")

@router.get("/status", response_model=AuthStatusResponse, summary="Check FYERS Authentication Status")
def status():
    """Returns whether the FYERS access token is available."""
    is_auth = fyers_auth_service.is_authenticated()
    return AuthStatusResponse(authenticated=is_auth)
