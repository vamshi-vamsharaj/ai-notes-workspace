"""
AI Repository — all database reads/writes for AI data.

Uses the same in-memory pattern as notes/tags repositories
(to be swapped for SQLAlchemy once Supabase DB is wired).
The interface is identical to what the SQLAlchemy version will look like,
so the swap is a 1-file change.
"""

from __future__ import annotations


import uuid
from collections import Counter
from datetime import datetime, timezone, timedelta
from typing import Any



# ── In-memory store ───────────────────────────────────────────────────────────
# Structure: { user_id: [generation_record, ...] }
_generations_db: dict[str, list[dict]] = {}


def _user_records(user_id: str) -> list[dict]:
    return _generations_db.setdefault(user_id, [])


class AIRepository:
    def __init__(self, user_id: str):
        self.user_id = user_id

    # ── Writes ────────────────────────────────────────────────────────────────

    def save_generation(
        self,
        note_id: str,
        action: str,
        result: Any,
        tokens_used: int, # type: ignore
        raw_text: str,
    ) -> dict:
        record = {
            "id": str(uuid.uuid4()),
            "user_id": self.user_id,
            "note_id": str(note_id),
            "action": action,
            "result": result,
            "raw_text": raw_text,
            "tokens_used": tokens_used,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _user_records(self.user_id).append(record)
        return record

    # ── Reads ─────────────────────────────────────────────────────────────────

    def get_history_for_note(
        self,
        note_id: str,
        limit: int = 20, # type: ignore
    ) -> list[dict]:
        records = [
            r for r in _user_records(self.user_id)
            if r["note_id"] == str(note_id)
        ]
        # Most recent first
        records.sort(key=lambda r: r["created_at"], reverse=True)
        return records[:limit]

    def get_usage_stats(self) -> dict:
        records = _user_records(self.user_id)

        total_generations = len(records)
        total_tokens = sum(r.get("tokens_used", 0) for r in records)

        # This week
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        this_week = sum(1 for r in records if r["created_at"] >= week_ago)

        # Action breakdown
        action_counter: Counter[str] = Counter(r["action"] for r in records)
        most_used = action_counter.most_common(1)[0][0] if action_counter else None

        return {
            "total_generations": total_generations,
            "total_tokens_used": total_tokens,
            "generations_this_week": this_week,
            "most_used_action": most_used,
            "action_breakdown": dict(action_counter),
        }