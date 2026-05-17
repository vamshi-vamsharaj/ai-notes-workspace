# backend/app/schemas/share.py
# WHY separate schema file: keeps share-specific types out of the giant notes schema,
# makes it easy to add expiry/password fields in Phase 6 without touching notes.py

from pydantic import BaseModel
from typing import Optional


class ShareEnableRequest(BaseModel):
    """Body for POST /notes/{id}/share — currently no options, reserves for future."""
    pass  # Future: expires_in_days, password, allow_copy


class ShareResponse(BaseModel):
    """Returned after enabling or fetching share state."""
    note_id: str
    is_public: bool
    share_token: Optional[str]
    share_url: Optional[str]   # absolute URL the frontend should display


class PublicNoteResponse(BaseModel):
    """
    Stripped-down note returned to unauthenticated callers.
    WHY stripped: never expose user_id or internal IDs to the public.
    """
    title: str
    content: str
    tags: list[dict]           # [{"name": "work", "color": "#7c3aed"}]
    ai_summary: Optional[str]
    created_at: str
    updated_at: str