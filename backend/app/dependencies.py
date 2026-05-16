# backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import settings

security = HTTPBearer()

def get_supabase_client() -> Client:
    """
    Returns a Supabase admin client for server-side operations.
    Uses the service role key — never expose this to the frontend.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    """
    Dependency injected into every protected route.
    """
    token = credentials.credentials

    try:
        # Let the official Supabase client handle the cryptography!
        # This automatically resolves ES256/HS256 and handles expiration checks.
        auth_response = supabase.auth.get_user(token)
        
        user = auth_response.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": user.id,
            "email": user.email,
            "role": user.role or "authenticated",
        }

    except Exception as e:
        # If Supabase rejects the token (expired, invalid signature, etc.)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )