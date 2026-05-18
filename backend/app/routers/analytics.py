# backend/app/routers/analytics.py
# Migration: in-memory _notes_db + _generations_db reads → SQLAlchemy queries.
# WHY SQL aggregates over Python loops:
# - No memory limit (in-memory version loaded ALL notes into Python)
# - GROUP BY date in SQL is an index scan, not O(n) iteration
# - Streak computation stays in Python (too complex for portable SQL)

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc, text, case
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user_with_profile
from app.models.note import Note, note_tags
from app.models.tag import Tag
from app.models.ai_generation import AIGeneration
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    DailyActivity,
    TagStat,
    WeeklyActivityResponse,
    NoteGrowthResponse,
    NoteGrowthPoint,
    AITrendsResponse,
    AITrendPoint,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _word_count(text_: str) -> int:
    return len(text_.split()) if text_ and text_.strip() else 0


def _streak(dates_set: set[str], today: str) -> tuple[int, int]:
    if not dates_set:
        return 0, 0
    sorted_dates = sorted(dates_set)
    longest = 1
    for i in range(1, len(sorted_dates)):
        prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d")
        curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d")
        if (curr - prev).days == 1:
            longest += 1
    today_dt = datetime.strptime(today, "%Y-%m-%d")
    current = 0
    check_dt = today_dt
    while check_dt.strftime("%Y-%m-%d") in dates_set:
        current += 1
        check_dt -= timedelta(days=1)
    if current == 0:
        check_dt = today_dt - timedelta(days=1)
        while check_dt.strftime("%Y-%m-%d") in dates_set:
            current += 1
            check_dt -= timedelta(days=1)
    return current, longest


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    user_uuid = UUID(current_user["id"])
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # ── Note counts ────────────────────────────────────────────────────────
    counts_result = await db.execute(
        select(
            func.count(Note.id).label("total"),
            func.sum(case((Note.is_archived == True, 1), else_=0)).label("archived"),  # noqa
            func.sum(case((Note.is_public == True, 1), else_=0)).label("public"),      # noqa
            func.sum(case((Note.created_at >= week_ago, 1), else_=0)).label("this_week"),
            func.sum(case((Note.created_at >= month_ago, 1), else_=0)).label("this_month"),
            func.sum(case((Note.ai_summary != None, 1), else_=0)).label("with_ai"),   # noqa
        ).where(Note.user_id == user_uuid)
    )
    counts = counts_result.one()

    # ── AI stats ───────────────────────────────────────────────────────────
    ai_totals = await db.execute(
        select(
            func.count(AIGeneration.id).label("total"),
            func.coalesce(func.sum(AIGeneration.tokens_used), 0).label("tokens"),
            func.sum(case((AIGeneration.created_at >= week_ago, 1), else_=0)).label("this_week"),
        ).where(AIGeneration.user_id == user_uuid)
    )
    ai_row = ai_totals.one()

    # Action breakdown
    ai_breakdown_result = await db.execute(
        select(AIGeneration.action, func.count(AIGeneration.id).label("cnt"))
        .where(AIGeneration.user_id == user_uuid)
        .group_by(AIGeneration.action)
    )
    action_breakdown = {row.action: row.cnt for row in ai_breakdown_result.all()}
    most_used_action = max(action_breakdown, key=action_breakdown.get, default=None)  # type: ignore

    # ── Tag stats ──────────────────────────────────────────────────────────
    tag_count_result = await db.execute(
        select(func.count(Tag.id)).where(Tag.user_id == user_uuid)
    )
    total_tags = tag_count_result.scalar_one()

    top_tags_result = await db.execute(
        select(Tag.name, Tag.color, func.count(note_tags.c.note_id).label("cnt"))
        .join(note_tags, Tag.id == note_tags.c.tag_id)
        .join(Note, Note.id == note_tags.c.note_id)
        .where(Tag.user_id == user_uuid)
        .group_by(Tag.id, Tag.name, Tag.color)
        .order_by(desc("cnt"))
        .limit(8)
    )
    top_tags = [
        TagStat(name=row.name, color=row.color, count=row.cnt)
        for row in top_tags_result.all()
    ]

    # ── Content stats ──────────────────────────────────────────────────────
    # Fetch all note contents for word counting
    # WHY not SQL: PostgreSQL word counting needs pg_ts_vector or regex
    # which is DB-version dependent. Python is fine for this aggregate.
    notes_content = await db.execute(
        select(Note.content, Note.updated_at).where(Note.user_id == user_uuid)
    )
    note_rows = notes_content.all()
    word_counts = [_word_count(r.content or "") for r in note_rows]
    total_words   = sum(word_counts)
    avg_words     = total_words // len(word_counts) if word_counts else 0
    longest_words = max(word_counts, default=0)

    # ── Streaks ────────────────────────────────────────────────────────────
    active_dates = {r.updated_at.strftime("%Y-%m-%d") for r in note_rows if r.updated_at}
    current_streak, longest_streak = _streak(active_dates, today)

    return AnalyticsSummaryResponse(
        total_notes=counts.total or 0,
        archived_notes=counts.archived or 0,
        public_notes=counts.public or 0,
        notes_this_week=counts.this_week or 0,
        notes_this_month=counts.this_month or 0,
        total_ai_generations=ai_row.total or 0,
        ai_generations_this_week=ai_row.this_week or 0,
        notes_with_ai_summary=counts.with_ai or 0,
        most_used_ai_action=most_used_action,
        ai_action_breakdown=action_breakdown,
        total_tags=total_tags,
        top_tags=top_tags,
        avg_note_length=avg_words,
        longest_note_words=longest_words,
        total_words_written=total_words,
        current_streak_days=current_streak,
        longest_streak_days=longest_streak,
    )


@router.get("/weekly", response_model=WeeklyActivityResponse)
async def get_weekly_activity(
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    user_uuid = UUID(current_user["id"])
    now = datetime.now(timezone.utc)

    # Notes created per day (last 7 days)
    notes_result = await db.execute(
        select(
            func.date(Note.created_at).label("day"),
            func.count(Note.id).label("created"),
        )
        .where(
            Note.user_id == user_uuid,
            Note.created_at >= now - timedelta(days=7),
        )
        .group_by(func.date(Note.created_at))
    )
    created_by_day = {str(r.day): r.created for r in notes_result.all()}

    # Notes edited per day (updated != created on that day)
    edited_result = await db.execute(
        select(
            func.date(Note.updated_at).label("day"),
            func.count(Note.id).label("edited"),
        )
        .where(
            Note.user_id == user_uuid,
            Note.updated_at >= now - timedelta(days=7),
            func.date(Note.updated_at) != func.date(Note.created_at),
        )
        .group_by(func.date(Note.updated_at))
    )
    edited_by_day = {str(r.day): r.edited for r in edited_result.all()}

    # AI generations per day
    ai_result = await db.execute(
        select(
            func.date(AIGeneration.created_at).label("day"),
            func.count(AIGeneration.id).label("ai"),
        )
        .where(
            AIGeneration.user_id == user_uuid,
            AIGeneration.created_at >= now - timedelta(days=7),
        )
        .group_by(func.date(AIGeneration.created_at))
    )
    ai_by_day = {str(r.day): r.ai for r in ai_result.all()}

    days = []
    total_created = 0
    total_ai = 0
    busiest_day = None
    busiest_count = 0

    for delta in range(6, -1, -1):
        day_dt = now - timedelta(days=delta)
        day_str = day_dt.strftime("%Y-%m-%d")

        created = created_by_day.get(day_str, 0)
        edited  = edited_by_day.get(day_str, 0)
        ai_gen  = ai_by_day.get(day_str, 0)
        total_created += created
        total_ai += ai_gen

        day_total = created + edited + ai_gen
        if day_total > busiest_count:
            busiest_count = day_total
            busiest_day = day_str

        days.append(DailyActivity(
            date=day_str,
            notes_created=created,
            notes_edited=edited,
            ai_generations=ai_gen,
        ))

    return WeeklyActivityResponse(
        days=days,
        total_notes_created=total_created,
        total_ai_generations=total_ai,
        most_active_day=busiest_day,
    )


@router.get("/growth", response_model=NoteGrowthResponse)
async def get_note_growth(
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    user_uuid = UUID(current_user["id"])
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=30)

    # Get all note creation dates in the window
    result = await db.execute(
        select(func.date(Note.created_at).label("day"), func.count(Note.id).label("cnt"))
        .where(Note.user_id == user_uuid, Note.created_at >= since)
        .group_by(func.date(Note.created_at))
        .order_by(func.date(Note.created_at))
    )
    by_day = {str(r.day): r.cnt for r in result.all()}

    # Count notes created BEFORE the 30-day window (baseline)
    baseline_result = await db.execute(
        select(func.count(Note.id)).where(Note.user_id == user_uuid, Note.created_at < since)
    )
    baseline = baseline_result.scalar_one() or 0

    # Build cumulative 30-day series
    points = []
    cumulative = baseline
    for delta in range(29, -1, -1):
        day_dt = now - timedelta(days=delta)
        day_str = day_dt.strftime("%Y-%m-%d")
        cumulative += by_day.get(day_str, 0)
        points.append(NoteGrowthPoint(date=day_str, cumulative_notes=cumulative))

    return NoteGrowthResponse(points=points)


@router.get("/ai-trends", response_model=AITrendsResponse)
async def get_ai_trends(
    current_user: dict = Depends(get_current_user_with_profile),
    db: AsyncSession = Depends(get_db),
):
    user_uuid = UUID(current_user["id"])
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=14)

    result = await db.execute(
        select(
            func.date(AIGeneration.created_at).label("day"),
            AIGeneration.action,
            func.count(AIGeneration.id).label("cnt"),
        )
        .where(
            AIGeneration.user_id == user_uuid,
            AIGeneration.created_at >= since,
        )
        .group_by(func.date(AIGeneration.created_at), AIGeneration.action)
        .order_by(func.date(AIGeneration.created_at))
    )

    points = [
        AITrendPoint(date=str(r.day), count=r.cnt, action=r.action)
        for r in result.all()
    ]
    return AITrendsResponse(daily=points)