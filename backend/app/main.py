# backend/app/main.py — ADD the startup event
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import auth, notes, tags, ai, share, analytics

# Import all models so Base.metadata knows about them
import app.models.note        # noqa
import app.models.tag         # noqa
import app.models.profile     # noqa
import app.models.ai_generation  # noqa — will create this in Step 2


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables that don't exist yet
    # WHY create_all and not Alembic: safe for dev — Alembic comes in Step 9
    # In production with existing data, use Alembic migrations only
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="NoteFlow API",
    description="AI-powered notes workspace backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ai-notes-workspace-pi.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(tags.router)
app.include_router(ai.router)
app.include_router(share.router)
app.include_router(analytics.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}