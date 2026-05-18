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
    
    # backend/app/dependencies.py  — ADD at the bottom (keep everything above unchanged)
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db


async def get_current_user_with_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Wraps get_current_user and ensures a profile row exists in our DB.
    
    WHY this instead of a middleware:
    - Only routes that write data need this guarantee
    - Middleware would run on every request including /health, /shared/:token
    - Dependency injection means it only fires when explicitly declared
    
    All protected routes that touch notes/tags/AI use this instead of
    get_current_user directly. Auth-only routes (like /auth/me) keep
    using get_current_user.
    """
    from app.repositories.profile_repository import ProfileRepository

    repo = ProfileRepository(db)
    await repo.upsert(
        user_id=current_user["id"],
        email=current_user["email"],
    )
    return current_user