# backend/app/database.py
# WHY SQLAlchemy + Supabase (PostgreSQL):
# Supabase provides the managed Postgres instance. SQLAlchemy gives us
# type-safe ORM queries, migrations (via Alembic), and async support.
# We do NOT use the Supabase Python client for data queries — only for auth.

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# WHY asyncpg: FastAPI is fully async; blocking DB calls would negate the benefit.
# asyncpg is the fastest PostgreSQL async driver for Python.
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,   # Validate connections on checkout (handles idle timeout)
connect_args={
        "ssl": "require",
        "statement_cache_size": 0,
    },
    )

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # WHY: prevents lazy-load errors after commit
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a DB session and commits/rolls back."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise