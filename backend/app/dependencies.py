# backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import jwt
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
    
    Flow:
    1. Extract Bearer token from Authorization header
    2. Verify it against Supabase's JWT secret
    3. Return the decoded user payload
    
    Why Supabase JWT verification instead of custom:
    - Supabase manages token rotation, expiry, and refresh automatically
    - The JWT is signed with your project's secret — tamper-proof
    - No need to store sessions server-side (stateless auth)
    """
    token = credentials.credentials

    try:
        # Decode and verify the JWT using Supabase's JWT secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase uses 'authenticated' audience
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Attach email from token metadata
        email = payload.get("email", "")
        role = payload.get("role", "authenticated")

        return {
            "id": user_id,
            "email": email,
            "role": role,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error",
        )