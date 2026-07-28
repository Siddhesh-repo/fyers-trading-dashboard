import logging
from fyers_apiv3 import fyersModel
from app.core.config import settings

logger = logging.getLogger(__name__)


class FyersAuthService:
    def __init__(self):
        self.client_id = settings.FYERS_CLIENT_ID
        self.secret_key = settings.FYERS_SECRET_KEY
        self.redirect_uri = settings.FYERS_REDIRECT_URI
        self.response_type = "code"
        self.grant_type = "authorization_code"
        self.state = "sample_state"

        # In-memory token storage (development only — use a persistent store in production)
        self._access_token = None

        self.session = fyersModel.SessionModel(
            client_id=self.client_id,
            secret_key=self.secret_key,
            redirect_uri=self.redirect_uri,
            response_type=self.response_type,
            grant_type=self.grant_type,
            state=self.state,
        )

    def generate_login_url(self) -> str:
        """Generates the official FYERS authorization URL."""
        if not self.client_id or not self.secret_key:
            logger.error("FYERS credentials are not fully configured.")
            raise ValueError("FYERS credentials missing")
        try:
            return self.session.generate_authcode()
        except Exception as e:
            logger.error("Error generating login URL: %s", e)
            raise

    def generate_access_token(self, auth_code: str) -> bool:
        """Exchanges the auth_code for an access_token."""
        try:
            self.session.set_token(auth_code)
            response = self.session.generate_token()
            if response.get("s") == "ok":
                self._access_token = response.get("access_token")
                logger.info("Successfully generated and stored FYERS access token.")
                return True
            logger.error("Failed to generate access token: %s", response)
            return False
        except Exception as e:
            logger.error("Error in token generation: %s", e)
            return False

    def is_authenticated(self) -> bool:
        """Returns True if an access token exists."""
        return self._access_token is not None

    def get_access_token(self) -> str | None:
        """Returns the stored access token."""
        return self._access_token


fyers_auth_service = FyersAuthService()


def get_fyers_client() -> fyersModel.FyersModel:
    """
    Build and return an authenticated FyersModel client.

    Shared factory used by market_service and account_service to avoid
    duplicating client-construction logic.

    Raises:
        RuntimeError: If no access token is currently stored.
    """
    token = fyers_auth_service.get_access_token()
    if not token:
        raise RuntimeError("Not authenticated with FYERS. Please complete OAuth login first.")
    return fyersModel.FyersModel(
        client_id=settings.FYERS_CLIENT_ID,
        token=token,
        log_path=None,
        is_async=False,
    )
