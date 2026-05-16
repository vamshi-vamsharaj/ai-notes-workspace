# backend/app/routers/notes.py
# FIXES:
# 1. All routes now require authentication via get_current_user dependency
# 2. GET /notes supports search, tag_id, is_archived, sort query parameters
# 3. Notes are scoped to the authenticated user (user_id from JWT)
# 4. 404 raised properly instead of returning {"error": ...} dict
# 5. PATCH correctly updates tags relationship via note_tags
# 6. In-memory store replaced with per-user dict so notes don't leak across users
# 7. Tags on notes return the full tag object list, not []
#
# NOTE: This is still an in-memory implementation (no real DB yet) but it correctly
# handles all filter/search/auth logic. Replace the storage layer with SQLAlchemy
# once the DB is wired — the router logic stays identical.

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone

from app.dependencies import get_current_user
from app.schemas.notes import NoteCreate, NoteUpdate, PaginatedNotesResponse

router = APIRouter(prefix="/notes", tags=["Notes"])

# ── In-memory store ──────────────────────────────────────────────────────────
# Structure: { user_id: [ note_dict, ... ] }
_notes_db: dict[str, list[dict]] = {}


def _get_user_notes(user_id: str) -> list[dict]:
    return _notes_db.setdefault(user_id, [])


def _find_note(user_id: str, note_id: str) -> dict | None:
    return next(
        (n for n in _get_user_notes(user_id) if n["id"] == note_id),
        None,
    )


# ── Helper: import tags store from tags router ────────────────────────────────
def _get_tag(user_id: str, tag_id: str) -> dict | None:
    """Look up a tag from the in-memory tags store (tags.py)."""
    from app.routers.tags import _get_user_tags  # local import avoids circular dep
    return next((t for t in _get_user_tags(user_id) if t["id"] == tag_id), None)


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=PaginatedNotesResponse)
async def get_notes(
    search: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    is_archived: bool = Query(False),
    sort: str = Query("updated_at"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    notes = list(_get_user_notes(user_id))  # shallow copy

    # Filter archived
    notes = [n for n in notes if n["is_archived"] == is_archived]

    # Full-text search across title + content
    if search:
        q = search.lower()
        notes = [
            n for n in notes
            if q in n["title"].lower() or q in n["content"].lower()
        ]

    # Filter by tag
    if tag_id:
        notes = [
            n for n in notes
            if any(t["id"] == tag_id for t in n.get("tags", []))
        ]

    # Sort
    reverse = sort != "title"
    sort_key = "updated_at" if sort not in ("title", "created_at", "updated_at") else sort
    notes.sort(key=lambda n: n.get(sort_key, ""), reverse=reverse)

    total = len(notes)

    # Paginate
    offset = (page - 1) * per_page
    paginated = notes[offset: offset + per_page]

    # Truncate content for list view (keep full content for detail view)
    list_notes = [
        {**n, "content": n["content"][:200]} for n in paginated
    ]

    return {"notes": list_notes, "total": total, "page": page, "per_page": per_page}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    # Resolve tag objects from IDs
    resolved_tags = []
    for tag_id in (payload.tag_ids or []):
        tag = _get_tag(user_id, str(tag_id))
        if tag:
            resolved_tags.append(tag)

    note = {
        "id": str(uuid4()),
        "user_id": user_id,
        "title": payload.title or "Untitled",
        "content": payload.content or "",
        "is_archived": False,
        "is_public": False,
        "share_token": None,
        "tags": resolved_tags,
        "ai_summary": None,
        "ai_action_items": [],
        "ai_suggested_title": None,
        "created_at": now,
        "updated_at": now,
    }
    _get_user_notes(user_id).append(note)
    return note


@router.get("/{note_id}")
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
):
    note = _find_note(current_user["id"], note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}")
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    note = _find_note(user_id, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if payload.title is not None:
        note["title"] = payload.title
    if payload.content is not None:
        note["content"] = payload.content
    if payload.is_archived is not None:
        note["is_archived"] = payload.is_archived

    # Update tags if provided
    if payload.tag_ids is not None:
        resolved_tags = []
        for tag_id in payload.tag_ids:
            tag = _get_tag(user_id, str(tag_id))
            if tag:
                resolved_tags.append(tag)
        note["tags"] = resolved_tags

    note["updated_at"] = datetime.now(timezone.utc).isoformat()
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    notes = _get_user_notes(user_id)
    original_len = len(notes)
    _notes_db[user_id] = [n for n in notes if n["id"] != note_id]
    if len(_notes_db[user_id]) == original_len:
        raise HTTPException(status_code=404, detail="Note not found")
    # 204 returns no body


@router.post("/{note_id}/tags")
async def update_note_tags(
    note_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Assign a new set of tags to a note."""
    user_id = current_user["id"]
    note = _find_note(user_id, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    tag_ids: list[str] = payload.get("tag_ids", [])
    resolved_tags = []
    for tag_id in tag_ids:
        tag = _get_tag(user_id, str(tag_id))
        if tag:
            resolved_tags.append(tag)

    note["tags"] = resolved_tags
    note["updated_at"] = datetime.now(timezone.utc).isoformat()
    return note