# backend/app/routers/share.py
# WHY this file still exists: GET /shared/{token} is a public endpoint
# that doesn't fit under /notes (no auth). Everything else moved to notes.py.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.notes_repository import NotesRepository
from app.schemas.share import PublicNoteResponse

router = APIRouter(tags=["Share"])


@router.get("/shared/{token}", response_model=PublicNoteResponse)
async def get_shared_note(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — no authentication.
    Uses NotesRepository.get_by_share_token() which was already written.
    WHY this is the cleanest approach: the repository handles the indexed
    share_token lookup in O(log n) instead of the in-memory O(n) scan.
    """
    repo = NotesRepository(db)
    note = await repo.get_by_share_token(token)

    if not note:
        raise HTTPException(
            status_code=404,
            detail="This note does not exist or sharing has been disabled.",
        )

    return PublicNoteResponse(
        title=note.title,
        content=note.content,
        tags=[{"name": t.name, "color": t.color} for t in (note.tags or [])],
        ai_summary=note.ai_summary,
        created_at=note.created_at.isoformat(),
        updated_at=note.updated_at.isoformat(),
    )