# backend/app/middleware/auth_middleware.py
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class AuthLoggingMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware that:
    - Logs all incoming requests with timing
    - Extracts user ID from JWT for structured logs (without re-validating)
    - Does NOT block requests — that's the dependency's job
    
    This separation of concerns keeps middleware fast and dependencies precise.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()

        # Extract token for logging context (no validation here)
        auth_header = request.headers.get("Authorization", "")
        has_token = auth_header.startswith("Bearer ")

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)

        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({duration_ms}ms) "
            f"[auth={'yes' if has_token else 'no'}]"
        )

        return response