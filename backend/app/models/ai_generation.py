# backend/app/models/ai_generation.py
# WHY a separate table for AI generations (not a JSONB column on Note):
# - Analytics need to GROUP BY action, COUNT by day, SUM tokens
# - These are aggregate queries — impossible cleanly from a JSONB blob
# - Per-note history requires ORDER BY created_at — needs rows, not blobs
# - Token tracking for future billing requires individual records

from sqlalchemy import (
    Column, String, Integer, Text, TIMESTAMP, ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.database import Base


class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who generated it and for which note
    user_id  = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    note_id  = Column(UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"),
                      nullable=False, index=True)

    # What was requested and what came back
    action      = Column(String(50),  nullable=False)   # "summary" | "action_items" | "title"
    result      = Column(JSONB,       nullable=True)     # parsed output (str | list | dict)
    raw_text    = Column(Text,        nullable=True)     # raw Gemini response (for debugging)
    tokens_used = Column(Integer,     nullable=False, default=0)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(),
                        nullable=False, index=True)

    # ── Indexes for analytics queries ──────────────────────────────────────
    # WHY these specific indexes:
    # - Analytics GROUP BY (user_id, action, date) → composite index covers it
    # - History for a note → (note_id, created_at DESC) covers the ORDER BY
    __table_args__ = (
        Index("ix_ai_gen_user_action", "user_id", "action"),
        Index("ix_ai_gen_note_created", "note_id", "created_at"),
        Index("ix_ai_gen_user_created", "user_id", "created_at"),
    )