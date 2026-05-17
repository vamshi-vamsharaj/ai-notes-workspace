# backend/app/repositories/notes_repository.py
# WHY a repository layer:
# Keeps raw SQL/ORM queries out of routers and services.
# If you ever swap SQLAlchemy for another ORM, only this file changes.

from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from sqlalchemy import select, func, or_, desc, asc, update
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from builtins import dict, hasattr, list ,len, sum , setattr

from app.models.note import Note, note_tags
from app.models.tag import Tag


class NotesRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: UUID,
        title: str,
        content: str,
    ) -> Note:
        note = Note(user_id=user_id, title=title, content=content)
        self.db.add(note)
        await self.db.flush()  # get the generated ID without committing
        await self.db.refresh(note, ["tags"])
        return note

    async def get_by_id(self, note_id: UUID, user_id: UUID) -> Optional[Note]:
        result = await self.db.execute(
            select(Note)
            .where(Note.id == note_id, Note.user_id == user_id)
            .options(selectinload(Note.tags))
        )
        return result.scalar_one_or_none()

    async def get_by_share_token(self, token: str) -> Optional[Note]:
        result = await self.db.execute(
            select(Note)
            .where(Note.share_token == token, Note.is_public == True)  # noqa: E712
            .options(selectinload(Note.tags))
        )
        return result.scalar_one_or_none()

    async def get_many(
        self,
        user_id: UUID,
        search: Optional[str] = None,
        tag_id: Optional[UUID] = None,
        is_archived: bool = False,
        sort: str = "updated_at",
        page: int = 1,
        per_page: int = 50,
    ) -> tuple[List[Note], int]:
        # Base query
        query = (
            select(Note)
            .where(Note.user_id == user_id, Note.is_archived == is_archived)
            .options(selectinload(Note.tags))
        )

        # Full-text search across title and content
        if search:
            search_term = f"%{search.lower()}%"
            query = query.where(
                or_(
                    func.lower(Note.title).like(search_term),
                    func.lower(Note.content).like(search_term),
                )
            )

        # Filter by tag (join through note_tags)
        if tag_id:
            query = query.join(note_tags, Note.id == note_tags.c.note_id).where(
                note_tags.c.tag_id == tag_id
            )

        # Sorting
        sort_col = {
            "updated_at": desc(Note.updated_at),
            "created_at": desc(Note.created_at),
            "title": asc(Note.title),
        }.get(sort, desc(Note.updated_at))
        query = query.order_by(sort_col)

        # Count total (before pagination)
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Paginate
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        result = await self.db.execute(query)
        notes = result.scalars().unique().all()

        return list(notes), total

    async def update(self, note: Note, **kwargs) -> Note:
        for key, value in kwargs.items():
            if hasattr(note, key) and value is not None:
                setattr(note, key, value)
        await self.db.flush()
        await self.db.refresh(note, ["tags"])
        return note

    async def set_tags(self, note: Note, tags: List[Tag]) -> Note:
        note.tags = tags
        await self.db.flush()
        await self.db.refresh(note, ["tags"])
        return note

    async def delete(self, note: Note) -> None:
        await self.db.delete(note)
        await self.db.flush()