# backend/app/models/note.py
from sqlalchemy import Column, String, Boolean, Text, TIMESTAMP, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base

# ─── Association table: note_tags ─────────────────────────────────────────────
note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False, default="Untitled")
    content = Column(Text, nullable=False, default="")
    is_archived = Column(Boolean, nullable=False, default=False)
    is_public = Column(Boolean, nullable=False, default=False)
    share_token = Column(String(64), unique=True, nullable=True, index=True)

    # AI fields — populated in Phase 4
    ai_summary = Column(Text, nullable=True)
    ai_action_items = Column(Text, nullable=True)   # JSON string
    ai_suggested_title = Column(String(500), nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    tags = relationship("Tag", secondary=note_tags, back_populates="notes", lazy="joined")