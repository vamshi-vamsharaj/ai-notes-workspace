# backend/app/routers/tags.py
# Migration: _tags_db in-memory dict → SQLAlchemy TagsRepository
# API surface preserved exactly — same URLs, same response shapes.

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user_with_profile
from app.repositories.tags_repository import TagsRepository

router = APIRouter(prefix="/tags", tags=["Tags"])


# ── Schemas (inline — simple enough to not need a separate file) ──────────────

class TagCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#7c3aed")


class TagUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = None


# ── Serialiser ────────────────────────────────────────────────────────────────

def _tag_to_dict(tag) -> dict:
    return {
        "id": str(tag.id),
        "user_id": str(tag.user_id),
        "name": tag.name,
        "color": tag.color,
        "created_at": tag.created_at.isoformat(),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def get_tags(
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = TagsRepository(db)
    tags = await repo.get_all(UUID(current_user["id"]))
    return [_tag_to_dict(t) for t in tags]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreateRequest,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = TagsRepository(db)
    try:
        tag = await repo.create(
            user_id=UUID(current_user["id"]),
            name=payload.name,
            color=payload.color,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return _tag_to_dict(tag)


@router.patch("/{tag_id}")
async def update_tag(
    tag_id: str,
    payload: TagUpdateRequest,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = TagsRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        tag_uuid = UUID(tag_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag = await repo.get_by_id(tag_uuid, user_uuid)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag = await repo.update(tag, name=payload.name, color=payload.color)
    return _tag_to_dict(tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = TagsRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        tag_uuid = UUID(tag_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag = await repo.get_by_id(tag_uuid, user_uuid)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await repo.delete(tag)