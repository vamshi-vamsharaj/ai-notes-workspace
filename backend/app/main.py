# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.middleware.auth_middleware import AuthLoggingMiddleware
from app.routers import auth
from app.routers import notes
from app.routers import tags
app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs",
    redoc_url="/redoc",
)
app.include_router(notes.router)
app.include_router(tags.router)
# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Custom Middleware ─────────────────────────────────────────────────────────
app.add_middleware(AuthLoggingMiddleware)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": f"{settings.APP_NAME} is running"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}