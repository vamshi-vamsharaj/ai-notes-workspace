# backend/app/repositories/tags_repository.py
# WHY a tags repository (not inline SQL in the router):
# - Mirrors NotesRepository pattern — consistent architecture
# - Tags are resolved by notes_repository too — shared repository avoids duplication
# - Unique constraint violations need to be caught and re-raised cleanly

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from uuid import UUID

from app.models.tag import Tag


class TagsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: UUID) -> List[Tag]:
        result = await self.db.execute(
            select(Tag)
            .where(Tag.user_id == user_id)
            .order_by(Tag.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, tag_id: UUID, user_id: UUID) -> Optional[Tag]:
        result = await self.db.execute(
            select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, tag_ids: List[UUID], user_id: UUID) -> List[Tag]:
        """Bulk fetch tags by IDs — used by notes router when resolving tag_ids."""
        if not tag_ids:
            return []
        result = await self.db.execute(
            select(Tag).where(Tag.id.in_(tag_ids), Tag.user_id == user_id)
        )
        return list(result.scalars().all())

    async def create(self, user_id: UUID, name: str, color: str) -> Tag:
        tag = Tag(user_id=user_id, name=name, color=color)
        self.db.add(tag)
        try:
            await self.db.flush()
        except IntegrityError:
            await self.db.rollback()
            raise ValueError(f"Tag '{name}' already exists.")
        return tag

    async def update(self, tag: Tag, name: Optional[str], color: Optional[str]) -> Tag:
        if name is not None:
            tag.name = name
        if color is not None:
            tag.color = color
        await self.db.flush()
        return tag

    async def delete(self, tag: Tag) -> None:
        await self.db.delete(tag)
        await self.db.flush()