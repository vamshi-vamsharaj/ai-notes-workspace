# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.dependencies import get_current_user, get_supabase_client
from supabase import Client

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─── Server-side Signup (optional — frontend can call Supabase directly) ──────
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    supabase: Client = Depends(get_supabase_client),
):
    """
    Creates a new Supabase user via the admin client.
    Also stores the display name in user_metadata.
    """
    try:
        response = supabase.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "user_metadata": {"name": payload.name},
                "email_confirm": True,  # Skip email confirmation for dev
            }
        )

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed. Please try again.",
            )

        # Sign in immediately to return a session token
        session_response = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )

        return {
            "access_token": session_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "name": payload.name,
            },
        }

    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )


# ─── Server-side Login ────────────────────────────────────────────────────────
@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    supabase: Client = Depends(get_supabase_client),
):
    try:
        response = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )

        user = response.user
        session = response.session

        return {
            "access_token": session.access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.user_metadata.get("name", ""),
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )


# ─── Get Current User (protected) ────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the currently authenticated user.
    This is the canonical way to verify a token is valid.
    """
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"],
    }


# ─── Verify Token ─────────────────────────────────────────────────────────────
@router.post("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Lightweight endpoint to check if a token is still valid.
    Frontend calls this on app load to restore session.
    """
    return {"valid": True, "user_id": current_user["id"]}