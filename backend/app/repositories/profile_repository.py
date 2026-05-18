# backend/app/repositories/profile_repository.py
# WHY upsert (not insert): the profile may already exist from a previous session.
# ON CONFLICT DO NOTHING is safe — we never want to overwrite email/name changes
# from Supabase's source of truth. We only ensure the row exists.

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import select
from uuid import UUID

from app.models.profile import Profile


class ProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert(self, user_id: str, email: str, name: str = "") -> None:
        """
        Ensure a profile row exists for this Supabase user.
        Called at the start of every authenticated request that touches user data.
        
        WHY ON CONFLICT DO NOTHING (not DO UPDATE):
        - We don't want a stale JWT's email to overwrite a freshly changed email
        - The insert is a no-op after the first call — extremely cheap
        """
        stmt = (
            pg_insert(Profile)
            .values(
                id=UUID(user_id),
                email=email,
                name=name or email.split("@")[0],
            )
            .on_conflict_do_nothing(index_elements=["id"])
        )
        await self.db.execute(stmt)
        # Note: caller's get_db() dependency commits the transaction