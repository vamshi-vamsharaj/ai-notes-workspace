# backend/app/routers/tags.py
# FIXES:
# 1. All routes require authentication
# 2. Tags are scoped per user (no cross-user leakage)
# 3. Uses Pydantic schema instead of raw dict payload
# 4. Added DELETE /tags/:id endpoint
# 5. Added PATCH /tags/:id endpoint
# 6. Exposes _get_user_tags() so notes.py can resolve tag objects from IDs

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone

from app.dependencies import get_current_user

router = APIRouter(prefix="/tags", tags=["Tags"])

# ── In-memory store ──────────────────────────────────────────────────────────
# Structure: { user_id: [ tag_dict, ... ] }
_tags_db: dict[str, list[dict]] = {}


def _get_user_tags(user_id: str) -> list[dict]:
    """Public helper so notes.py can look up tags."""
    return _tags_db.setdefault(user_id, [])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TagCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#7c3aed")


class TagUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = None


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/")
async def get_tags(current_user: dict = Depends(get_current_user)):
    return _get_user_tags(current_user["id"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    # Prevent duplicate tag names per user (case-insensitive)
    existing = _get_user_tags(user_id)
    if any(t["name"].lower() == payload.name.lower() for t in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag '{payload.name}' already exists.",
        )

    tag = {
        "id": str(uuid4()),
        "user_id": user_id,
        "name": payload.name,
        "color": payload.color,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    existing.append(tag)
    return tag


@router.patch("/{tag_id}")
async def update_tag(
    tag_id: str,
    payload: TagUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    tag = next((t for t in _get_user_tags(user_id) if t["id"] == tag_id), None)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if payload.name is not None:
        tag["name"] = payload.name
    if payload.color is not None:
        tag["color"] = payload.color

    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    tags = _get_user_tags(user_id)
    original_len = len(tags)
    _tags_db[user_id] = [t for t in tags if t["id"] != tag_id]
    if len(_tags_db[user_id]) == original_len:
        raise HTTPException(status_code=404, detail="Tag not found")