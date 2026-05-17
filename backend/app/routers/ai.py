# backend/app/routers/ai.py
"""
AI Router — orchestrates ai_service + ai_repository per request.

Route design:
  POST /ai/generate        — main generation endpoint
  GET  /ai/history/{note_id} — generation history for a note
  GET  /ai/usage           — usage stats for the current user

WHY a separate /ai prefix (not /notes/:id/generate-summary):
- AI is a cross-cutting concern that will eventually serve multiple resource
  types (notes, folders, search results). A flat /ai namespace scales better.
- The assignment's suggested endpoint (POST /notes/:id/generate-summary) is
  fine too — both are mentioned in the README.

Rate limiting strategy (in-memory, per user):
- Simple sliding window: max 20 requests per minute per user.
- In production: replace with Redis INCR/EXPIRE for multi-instance correctness.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.repositories.ai_repository import AIRepository
from app.schemas.ai import (
    AIGenerateRequest,
    AIGenerateResponse,
    AIGenerationHistoryResponse,
    AIUsageStatsResponse,
)
from app.services.ai_service import AIServiceError, ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])

# ── In-memory rate limiter ────────────────────────────────────────────────────
# { user_id: deque of timestamps }
_rate_limit_store: dict[str, deque] = defaultdict(deque)
RATE_LIMIT_REQUESTS = 20
RATE_LIMIT_WINDOW = 60  # seconds


def _check_rate_limit(user_id: str) -> None:
    """Raise 429 if user has exceeded RATE_LIMIT_REQUESTS in the last window."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    q = _rate_limit_store[user_id]

    # Drop timestamps outside the window
    while q and q[0] < window_start:
        q.popleft()

    if len(q) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Max {RATE_LIMIT_REQUESTS} AI requests per minute.",
            headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
        )

    q.append(now)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=AIGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_ai_content(
    payload: AIGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate AI content for a note.
    The caller provides the note content directly (avoids a DB roundtrip
    and lets the frontend send the latest unsaved draft).
    """
    user_id = current_user["id"]
    _check_rate_limit(user_id)

    try:
        output = await ai_service.generate(
            action=payload.action,
            content=payload.content,
        )
    except AIServiceError as exc:
        logger.error("AI generation failed for user %s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected AI error for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )

    # Persist the generation
    repo = AIRepository(user_id)
    record = repo.save_generation(
        note_id=str(payload.note_id),
        action=output["action"],
        result=output["result"],
        tokens_used=output["tokens_used"],
        raw_text=output["raw_text"],
    )

    return {
        "id": record["id"],
        "note_id": payload.note_id,
        "action": record["action"],
        "result": record["result"],
        "tokens_used": record["tokens_used"],
        "created_at": record["created_at"],
        "cached": False,
    }


@router.get("/history/{note_id}", response_model=AIGenerationHistoryResponse)
async def get_generation_history(
    note_id: UUID,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Return the most recent AI generations for a specific note."""
    repo = AIRepository(current_user["id"])
    items = repo.get_history_for_note(str(note_id), limit=limit)
    return {"items": items, "total": len(items)}


@router.get("/usage", response_model=AIUsageStatsResponse)
async def get_usage_stats(
    current_user: dict = Depends(get_current_user),
):
    """Return AI usage statistics for the current user (feeds analytics dashboard)."""
    repo = AIRepository(current_user["id"])
    return repo.get_usage_stats()