# backend/app/schemas/notes.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ─── Tag schemas ──────────────────────────────────────────────────────────────

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#7c3aed", pattern=r"^#[0-9a-fA-F]{6}$")


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class TagResponse(TagBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Note schemas ─────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    title: str = Field(default="Untitled", max_length=500)
    content: str = Field(default="")
    tag_ids: List[UUID] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    is_archived: Optional[bool] = None
    tag_ids: Optional[List[UUID]] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            return "Untitled"
        return v


class NoteListResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    content: str  # truncated snippet — done in service layer
    is_archived: bool
    tags: List[TagResponse]
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteDetailResponse(NoteListResponse):
    content: str  # full content
    is_public: bool
    share_token: Optional[str] = None
    ai_action_items: Optional[List[str]] = None
    ai_suggested_title: Optional[str] = None


class NoteTagsUpdate(BaseModel):
    tag_ids: List[UUID]


class PaginatedNotesResponse(BaseModel):
    notes: List[NoteListResponse]
    total: int
    page: int
    per_page: int