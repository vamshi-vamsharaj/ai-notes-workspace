# backend/app/main.py
# Add this import and router inclusion to your existing main.py
# (this shows only the diff — don't replace your whole file)

# Add to imports:
from app.routers import ai  # noqa: new import

# Add to app.include_router calls:
# app.include_router(ai.router)

# ─── Full updated main.py (copy-paste safe) ───────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, notes, tags, ai ,share, analytics  # ← ai added


app = FastAPI(
    title="NoteFlow API",
    description="AI-powered notes workspace backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(tags.router)
app.include_router(ai.router)   # ← new
app.include_router(share.router)
app.include_router(analytics.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}