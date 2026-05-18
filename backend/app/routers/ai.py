# backend/app/routers/ai.py
# Change from in-memory AIRepository to SQLAlchemy version.
# WHY minimal changes: the router logic is correct. Only the repo instantiation changes.

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user_with_profile
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

# ── In-memory rate limiter (stays in-memory — it's session-scoped by design) ──
_rate_limit_store: dict[str, deque] = defaultdict(deque)
RATE_LIMIT_REQUESTS = 20
RATE_LIMIT_WINDOW = 60


def _check_rate_limit(user_id: str) -> None:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    q = _rate_limit_store[user_id]
    while q and q[0] < window_start:
        q.popleft()
    if len(q) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Max {RATE_LIMIT_REQUESTS} AI requests per minute.",
            headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
        )
    q.append(now)


@router.post("/generate", response_model=AIGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_ai_content(
    payload: AIGenerateRequest,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user["id"]
    _check_rate_limit(user_id)

    try:
        output = await ai_service.generate(action=payload.action, content=payload.content)
    except AIServiceError as exc:
        logger.error("AI generation failed for user %s: %s", user_id, exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except Exception:
        logger.exception("Unexpected AI error for user %s", user_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An unexpected error occurred. Please try again.")

    # ── Persist to DB (was in-memory before) ─────────────────────────────────
    repo = AIRepository(db=db, user_id=user_id)
    record = await repo.save_generation(
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
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = AIRepository(db=db, user_id=current_user["id"])
    items = await repo.get_history_for_note(str(note_id), limit=limit)
    return {"items": items, "total": len(items)}


@router.get("/usage", response_model=AIUsageStatsResponse)
async def get_usage_stats(
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = AIRepository(db=db, user_id=current_user["id"])
    return await repo.get_usage_stats()