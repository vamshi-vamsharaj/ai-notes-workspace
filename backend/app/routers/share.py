# backend/app/routers/share.py
# WHY separate router (not bolted onto notes.py):
# - notes.py is already 200+ lines of in-memory CRUD
# - share logic has its own concerns: token generation, public access (no auth)
# - keeping it separate means zero risk of merge conflicts with notes.py
# - the public GET /shared/{token} endpoint intentionally has NO auth dependency

import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.dependencies import get_current_user
from app.schemas.share import ShareEnableRequest, ShareResponse, PublicNoteResponse

# Import the in-memory store from notes router
# WHY local import: avoids circular imports while sharing the same data store
from app.routers.notes import _find_note, _get_user_notes

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Share"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_share_url(request: Request, token: str) -> str:
    """
    Build the absolute public URL.
    WHY use request.base_url: works in dev (localhost:8000) and production
    without hardcoding a domain. The frontend consumes this URL directly.
    
    In production with a CDN, override via a FRONTEND_BASE_URL env var.
    """
    # Return a frontend URL — the public page lives on the React app, not the API.
    # We derive it by swapping the API port. Override in prod with env var.
    base = str(request.base_url).rstrip("/")
    # Replace :8000 with :5173 for dev — frontend handles /shared/:token
    frontend_base = base.replace(":8000", ":5173")
    return f"{frontend_base}/shared/{token}"


# ── POST /notes/{note_id}/share — enable sharing ──────────────────────────────

@router.post(
    "/notes/{note_id}/share",
    response_model=ShareResponse,
    summary="Enable public sharing for a note",
)
async def enable_share(
    note_id: str,
    request: Request,
    _body: ShareEnableRequest = ShareEnableRequest(),
    current_user: dict = Depends(get_current_user),
):
    """
    Generates a secure random token and marks the note as public.
    
    Idempotent: calling it again on an already-shared note returns the
    existing token (no regeneration). This prevents breaking existing links
    already distributed by the user.
    
    Token design: secrets.token_urlsafe(32) produces 43 URL-safe chars —
    256 bits of entropy, brute-force infeasible, no guessable patterns.
    """
    user_id = current_user["id"]
    note = _find_note(user_id, note_id)

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Idempotent — reuse existing token if already shared
    if note.get("share_token"):
        token = note["share_token"]
    else:
        token = secrets.token_urlsafe(32)
        note["share_token"] = token

    note["is_public"] = True

    logger.info("Note %s shared by user %s", note_id, user_id)

    return ShareResponse(
        note_id=note_id,
        is_public=True,
        share_token=token,
        share_url=_build_share_url(request, token),
    )


# ── DELETE /notes/{note_id}/share — disable sharing ──────────────────────────

@router.delete(
    "/notes/{note_id}/share",
    response_model=ShareResponse,
    summary="Disable public sharing for a note",
)
async def disable_share(
    note_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Marks the note private and invalidates the share token.
    
    WHY invalidate the token: if a user disables sharing, they expect the
    old link to stop working immediately. We null out the token so any
    existing link returns 404.
    """
    user_id = current_user["id"]
    note = _find_note(user_id, note_id)

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note["is_public"] = False
    note["share_token"] = None

    return ShareResponse(
        note_id=note_id,
        is_public=False,
        share_token=None,
        share_url=None,
    )


# ── GET /shared/{token} — PUBLIC endpoint, no auth ───────────────────────────

@router.get(
    "/shared/{token}",
    response_model=PublicNoteResponse,
    summary="Fetch a publicly shared note (no authentication required)",
)
async def get_shared_note(token: str):
    """
    WHY no Depends(get_current_user): this is intentionally public.
    Anyone with the link can read the note, whether logged in or not.
    
    WHY scan all users' notes: the token is the only lookup key —
    we don't know which user owns it. In production, add a separate
    share_tokens table with (token, note_id, user_id) for O(1) lookup.
    
    Security: token is 256-bit random — scanning is the only attack surface.
    The note owner can revoke at any time via DELETE /notes/{id}/share.
    """
    # Scan all users' notes for this token
    # Production: replace with indexed DB query
    from app.routers.notes import _notes_db  # local import to avoid circular

    for user_notes in _notes_db.values():
        for note in user_notes:
            if note.get("share_token") == token and note.get("is_public"):
                # Return stripped-down public view
                return PublicNoteResponse(
                    title=note["title"],
                    content=note["content"],
                    tags=[
                        {"name": t["name"], "color": t["color"]}
                        for t in note.get("tags", [])
                    ],
                    ai_summary=note.get("ai_summary"),
                    created_at=note["created_at"],
                    updated_at=note["updated_at"],
                )

    raise HTTPException(
        status_code=404,
        detail="This note does not exist or sharing has been disabled.",
    )


# ── GET /notes/{note_id}/share — get current share state ─────────────────────

@router.get(
    "/notes/{note_id}/share",
    response_model=ShareResponse,
    summary="Get current share state of a note",
)
async def get_share_state(
    note_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Frontend calls this when opening the Share modal to pre-populate
    the toggle and copy-link field without re-generating the token.
    """
    user_id = current_user["id"]
    note = _find_note(user_id, note_id)

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    token = note.get("share_token")
    return ShareResponse(
        note_id=note_id,
        is_public=note.get("is_public", False),
        share_token=token,
        share_url=_build_share_url(request, token) if token else None,
    )