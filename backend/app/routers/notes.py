# backend/app/routers/notes.py
# Migration: in-memory dict → SQLAlchemy via NotesRepository
#
# WHY the API surface is preserved exactly:
# - Frontend sends/receives the same JSON shapes
# - No URL changes, no field renames, no pagination format changes
#
# What changed internally:
# - Every route now takes `db: AsyncSession = Depends(get_db)`
# - User lookups go to NotesRepository instead of _notes_db dicts
# - get_current_user → get_current_user_with_profile (ensures profiles row exists)
# - Note ORM objects are serialised to dict via _note_to_dict()

from __future__ import annotations

import json
import secrets
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user_with_profile
from app.repositories.notes_repository import NotesRepository
from app.repositories.tags_repository import TagsRepository
from app.schemas.notes import NoteCreate, NoteUpdate, PaginatedNotesResponse
from app.schemas.share import ShareResponse, PublicNoteResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes"])


# ── Serialiser ────────────────────────────────────────────────────────────────

def _note_to_dict(note, *, truncate: Optional[int] = None) -> dict:
    """
    Converts a Note ORM object to the dict shape the frontend expects.
    WHY not Pydantic model_validate here: the router returns dicts directly
    and FastAPI serialises them — adding a Pydantic layer would be redundant.
    
    The frontend receives the same fields it always got from the in-memory version.
    """
    content = note.content or ""
    if truncate:
        content = content[:truncate]

    # ai_action_items stored as JSON string — parse back to list
    action_items: list = []
    if note.ai_action_items:
        try:
            action_items = json.loads(note.ai_action_items)
        except (json.JSONDecodeError, TypeError):
            action_items = []

    return {
        "id": str(note.id),
        "user_id": str(note.user_id),
        "title": note.title,
        "content": content,
        "is_archived": note.is_archived,
        "is_public": note.is_public,
        "share_token": note.share_token,
        "tags": [
            {
                "id": str(t.id),
                "user_id": str(t.user_id),
                "name": t.name,
                "color": t.color,
                "created_at": t.created_at.isoformat(),
            }
            for t in (note.tags or [])
        ],
        "ai_summary": note.ai_summary,
        "ai_action_items": action_items,
        "ai_suggested_title": note.ai_suggested_title,
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat(),
    }


# ── GET /notes/ ───────────────────────────────────────────────────────────────

@router.get("/")
async def get_notes(
    search: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    is_archived: bool = Query(False),
    sort: str = Query("updated_at"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    user_uuid = UUID(current_user["id"])
    tag_uuid = UUID(tag_id) if tag_id else None

    notes, total = await repo.get_many(
        user_id=user_uuid,
        search=search,
        tag_id=tag_uuid,
        is_archived=is_archived,
        sort=sort,
        page=page,
        per_page=per_page,
    )

    return {
        "notes": [_note_to_dict(n, truncate=200) for n in notes],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ── POST /notes/ ──────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    tags_repo = TagsRepository(db)
    user_uuid = UUID(current_user["id"])
    print(payload.model_dump())
    # Create the note
    note = await repo.create(
        user_id=user_uuid,
        title=payload.title or "Untitled",
        content=payload.content or "",
    )

    # Resolve and attach tags if provided
    if payload.tag_ids:
        tags = await tags_repo.get_by_ids(payload.tag_ids, user_uuid)
        note = await repo.set_tags(note, tags)

    return _note_to_dict(note)


# ── GET /notes/{note_id} ──────────────────────────────────────────────────────

@router.get("/{note_id}")
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, UUID(current_user["id"]))
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    return _note_to_dict(note)


# ── PATCH /notes/{note_id} ────────────────────────────────────────────────────

@router.patch("/{note_id}")
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    tags_repo = TagsRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, user_uuid)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Build kwargs for fields that were explicitly provided
    update_kwargs: dict = {}
    if payload.title is not None:
        update_kwargs["title"] = payload.title
    if payload.content is not None:
        update_kwargs["content"] = payload.content
    if payload.is_archived is not None:
        update_kwargs["is_archived"] = payload.is_archived

    if update_kwargs:
        note = await repo.update(note, **update_kwargs)

    # Update tag relationship if tag_ids provided
    if payload.tag_ids is not None:
        tags = await tags_repo.get_by_ids(payload.tag_ids, user_uuid)
        note = await repo.set_tags(note, tags)

    return _note_to_dict(note)


# ── DELETE /notes/{note_id} ───────────────────────────────────────────────────

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, user_uuid)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await repo.delete(note)


# ── POST /notes/{note_id}/tags ────────────────────────────────────────────────

@router.post("/{note_id}/tags")
async def update_note_tags(
    note_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    tags_repo = TagsRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, user_uuid)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    tag_id_strs: list[str] = payload.get("tag_ids", [])
    try:
        tag_uuids = [UUID(tid) for tid in tag_id_strs]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tag ID format")

    tags = await tags_repo.get_by_ids(tag_uuids, user_uuid)
    note = await repo.set_tags(note, tags)
    return _note_to_dict(note)


# ── SHARE ENDPOINTS (migrated here from share.py to share the NotesRepository) ─

def _build_share_url(request: Request, token: str) -> str:
    base = str(request.base_url).rstrip("/")
    frontend_base = base.replace(":8000", ":5173")
    return f"{frontend_base}/shared/{token}"


@router.post("/{note_id}/share")
async def enable_share(
    note_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, user_uuid)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Idempotent — reuse existing token
    token = note.share_token or secrets.token_urlsafe(32)
    note = await repo.update(note, share_token=token, is_public=True)

    return {
        "note_id": note_id,
        "is_public": True,
        "share_token": token,
        "share_url": _build_share_url(request, token),
    }


@router.delete("/{note_id}/share")
async def disable_share(
    note_id: str,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, user_uuid)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.update(note, is_public=False, share_token=None)
    return {"note_id": note_id, "is_public": False, "share_token": None, "share_url": None}


@router.get("/{note_id}/share")
async def get_share_state(
    note_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    repo = NotesRepository(db)
    user_uuid = UUID(current_user["id"])

    try:
        note_uuid = UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Note not found")

    note = await repo.get_by_id(note_uuid, user_uuid)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    token = note.share_token
    return {
        "note_id": note_id,
        "is_public": note.is_public,
        "share_token": token,
        "share_url": _build_share_url(request, token) if token else None,
    }