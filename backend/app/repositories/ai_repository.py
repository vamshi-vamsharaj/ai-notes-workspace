# backend/app/repositories/ai_repository.py
# Replaces the in-memory implementation with SQLAlchemy.
# WHY the public interface is identical to the old version:
# - ai.py router calls repo.save_generation() and repo.get_history_for_note()
# - analytics.py router calls _user_records() — we replace that with a method
# - Zero changes needed in any caller

from __future__ import annotations

import json
import logging
from collections import Counter
from datetime import datetime, timezone, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.models.ai_generation import AIGeneration

logger = logging.getLogger(__name__)


class AIRepository:
    def __init__(self, db: AsyncSession, user_id: str):
        self.db = db
        self.user_id = user_id
        self._user_uuid = UUID(user_id)

    # ── Writes ────────────────────────────────────────────────────────────────

    async def save_generation(
        self,
        note_id: str,
        action: str,
        result: Any,
        tokens_used: int,
        raw_text: str,
    ) -> dict:
        """
        Persist an AI generation. Returns a dict with the same shape as before
        so the ai.py router needs zero changes.
        """
        generation = AIGeneration(
            user_id=self._user_uuid,
            note_id=UUID(note_id),
            action=action,
            result=result,          # JSONB handles str | list | dict natively
            raw_text=raw_text,
            tokens_used=tokens_used,
        )
        self.db.add(generation)
        await self.db.commit()
        await self.db.refresh(generation)      # get the generated id + created_at

        return self._to_dict(generation)

    # ── Reads ─────────────────────────────────────────────────────────────────

    async def get_history_for_note(
        self,
        note_id: str,
        limit: int = 20,
    ) -> list[dict]:
        result = await self.db.execute(
            select(AIGeneration)
            .where(
                AIGeneration.user_id == self._user_uuid,
                AIGeneration.note_id == UUID(note_id),
            )
            .order_by(desc(AIGeneration.created_at))
            .limit(limit)
        )
        return [self._to_dict(r) for r in result.scalars().all()]

    async def get_usage_stats(self) -> dict:
        """
        Aggregate stats for the /ai/usage endpoint.
        WHY SQL aggregates: O(1) regardless of history size.
        In-memory version was O(n) on every request.
        """
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        # Total + tokens
        total_result = await self.db.execute(
            select(
                func.count(AIGeneration.id).label("total"),
                func.coalesce(func.sum(AIGeneration.tokens_used), 0).label("tokens"),
            ).where(AIGeneration.user_id == self._user_uuid)
        )
        totals = total_result.one()

        # This week
        week_result = await self.db.execute(
            select(func.count(AIGeneration.id))
            .where(
                AIGeneration.user_id == self._user_uuid,
                AIGeneration.created_at >= week_ago,
            )
        )
        this_week = week_result.scalar_one()

        # Action breakdown
        breakdown_result = await self.db.execute(
            select(AIGeneration.action, func.count(AIGeneration.id).label("cnt"))
            .where(AIGeneration.user_id == self._user_uuid)
            .group_by(AIGeneration.action)
        )
        action_breakdown = {row.action: row.cnt for row in breakdown_result.all()}
        most_used = max(action_breakdown, key=action_breakdown.get, default=None)  # type: ignore

        return {
            "total_generations": totals.total,
            "total_tokens_used": totals.tokens,
            "generations_this_week": this_week,
            "most_used_action": most_used,
            "action_breakdown": action_breakdown,
        }

    async def get_records_for_analytics(
        self,
        since: datetime,
    ) -> list[AIGeneration]:
        """Used by analytics router for trend/activity queries."""
        result = await self.db.execute(
            select(AIGeneration)
            .where(
                AIGeneration.user_id == self._user_uuid,
                AIGeneration.created_at >= since,
            )
            .order_by(AIGeneration.created_at)
        )
        return list(result.scalars().all())

    # ── Internal ──────────────────────────────────────────────────────────────

    @staticmethod
    def _to_dict(g: AIGeneration) -> dict:
        """
        Returns same dict shape as old in-memory version.
        WHY: ai.py router returns this dict directly — no changes needed there.
        """
        return {
            "id": str(g.id),
            "user_id": str(g.user_id),
            "note_id": str(g.note_id),
            "action": g.action,
            "result": g.result,
            "raw_text": g.raw_text or "",
            "tokens_used": g.tokens_used,
            "created_at": g.created_at.isoformat() if g.created_at else "",
        }