# backend/app/models/tag.py
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base
from app.models.note import note_tags


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), nullable=False, default="#7c3aed")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    # Each user's tags must have unique names
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_tag_name"),)

    # Relationship back to notes
    notes = relationship("Note", secondary=note_tags, back_populates="tags", lazy="dynamic")