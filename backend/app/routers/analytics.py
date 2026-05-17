# backend/app/routers/analytics.py
# WHY analytics lives in its own router (not bolted onto /ai or /notes):
# - Analytics is a read-only, cross-concern aggregation
# - It reads from BOTH _notes_db and _generations_db
# - Keeping it separate means zero changes to existing routers

from __future__ import annotations

import logging
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
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

def _date_str(iso: str) -> str:
    """Convert ISO timestamp to YYYY-MM-DD string for bucketing."""
    return iso[:10]


def _word_count(text: str) -> int:
    return len(text.split()) if text and text.strip() else 0


def _streak(dates_set: set[str], today: str) -> tuple[int, int]:
    """
    Given a set of date strings (YYYY-MM-DD) and today's date,
    return (current_streak, longest_streak).
    
    Current streak: consecutive days ending today (or yesterday — we don't
    penalise users who haven't written yet today).
    """
    if not dates_set:
        return 0, 0

    sorted_dates = sorted(dates_set)
    longest = current = 1
    max_streak = 1

    # Compute longest streak
    for i in range(1, len(sorted_dates)):
        prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d")
        curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d")
        if (curr - prev).days == 1:
            longest += 1
            max_streak = max(max_streak, longest)
        else:
            longest = 1

    # Compute current streak (working backward from today)
    today_dt = datetime.strptime(today, "%Y-%m-%d")
    check_dt = today_dt
    current = 0

    while check_dt.strftime("%Y-%m-%d") in dates_set:
        current += 1
        check_dt -= timedelta(days=1)

    # Also accept "started yesterday" as an active streak
    if current == 0:
        yesterday = (today_dt - timedelta(days=1)).strftime("%Y-%m-%d")
        check_dt = today_dt - timedelta(days=1)
        while check_dt.strftime("%Y-%m-%d") in dates_set:
            current += 1
            check_dt -= timedelta(days=1)

    return current, max_streak


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    """
    Single endpoint that returns everything the AI Insights dashboard needs.
    WHY one fat endpoint instead of many thin ones:
    - The dashboard renders all widgets at once — one round-trip is faster
    - Analytics computation is cheap (in-memory iteration)
    - In Phase 6 (SQLAlchemy), wrap this in a single transaction with
      aggregate queries — the response shape stays identical
    """
    # Local imports to avoid circular dependency
    from app.routers.notes import _get_user_notes
    from app.routers.tags import _get_user_tags  # type: ignore
    from app.repositories.ai_repository import _user_records

    user_id = current_user["id"]
    notes   = _get_user_notes(user_id)
    tags    = _get_user_tags(user_id)
    ai_recs = _user_records(user_id)

    now      = datetime.now(timezone.utc)
    today    = now.strftime("%Y-%m-%d")
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    # ── Note counts ────────────────────────────────────────────────────────
    total_notes      = len(notes)
    archived_notes   = sum(1 for n in notes if n.get("is_archived"))
    public_notes     = sum(1 for n in notes if n.get("is_public"))
    notes_this_week  = sum(1 for n in notes if n["created_at"] >= week_ago)
    notes_this_month = sum(1 for n in notes if n["created_at"] >= month_ago)

    # ── AI stats ───────────────────────────────────────────────────────────
    total_ai    = len(ai_recs)
    ai_week     = sum(1 for r in ai_recs if r["created_at"] >= week_ago)
    ai_with_sum = sum(1 for n in notes if n.get("ai_summary"))
    action_counter: Counter[str] = Counter(r["action"] for r in ai_recs)
    most_used_action = action_counter.most_common(1)[0][0] if action_counter else None

    # ── Tag stats ──────────────────────────────────────────────────────────
    tag_usage: Counter[str] = Counter()
    tag_map = {t["id"]: t for t in tags}
    for note in notes:
        for tag in note.get("tags", []):
            tag_usage[tag["id"]] += 1

    top_tags = [
        TagStat(
            name=tag_map[tid]["name"],
            color=tag_map[tid]["color"],
            count=count,
        )
        for tid, count in tag_usage.most_common(8)
        if tid in tag_map
    ]

    # ── Content stats ──────────────────────────────────────────────────────
    word_counts = [_word_count(n.get("content", "")) for n in notes]
    total_words   = sum(word_counts)
    avg_words     = total_words // total_notes if total_notes else 0
    longest_words = max(word_counts, default=0)

    # ── Streaks ────────────────────────────────────────────────────────────
    active_dates = {_date_str(n["updated_at"]) for n in notes}
    current_streak, longest_streak = _streak(active_dates, today)

    return AnalyticsSummaryResponse(
        total_notes=total_notes,
        archived_notes=archived_notes,
        public_notes=public_notes,
        notes_this_week=notes_this_week,
        notes_this_month=notes_this_month,
        total_ai_generations=total_ai,
        ai_generations_this_week=ai_week,
        notes_with_ai_summary=ai_with_sum,
        most_used_ai_action=most_used_action,
        ai_action_breakdown=dict(action_counter),
        total_tags=len(tags),
        top_tags=top_tags,
        avg_note_length=avg_words,
        longest_note_words=longest_words,
        total_words_written=total_words,
        current_streak_days=current_streak,
        longest_streak_days=longest_streak,
    )


@router.get("/weekly", response_model=WeeklyActivityResponse)
async def get_weekly_activity(current_user: dict = Depends(get_current_user)):
    """
    Returns 7 days of bucketed activity — drives the bar chart on the dashboard.
    Each day shows notes_created, notes_edited (updated but not on creation day),
    and ai_generations.
    """
    from app.routers.notes import _get_user_notes
    from app.repositories.ai_repository import _user_records

    user_id = current_user["id"]
    notes   = _get_user_notes(user_id)
    ai_recs = _user_records(user_id)

    # Build 7-day window
    now   = datetime.now(timezone.utc)
    days: list[DailyActivity] = []
    total_created = 0
    total_ai      = 0
    busiest_day   = None
    busiest_count = 0

    for delta in range(6, -1, -1):   # oldest → newest
        day_dt  = now - timedelta(days=delta)
        day_str = day_dt.strftime("%Y-%m-%d")

        created = sum(1 for n in notes if _date_str(n["created_at"]) == day_str)
        edited  = sum(
            1 for n in notes
            if _date_str(n["updated_at"]) == day_str
            and _date_str(n["created_at"]) != day_str
        )
        ai_gen  = sum(1 for r in ai_recs if _date_str(r["created_at"]) == day_str)

        total_created += created
        total_ai      += ai_gen

        day_total = created + edited + ai_gen
        if day_total > busiest_count:
            busiest_count = day_total
            busiest_day   = day_str

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
async def get_note_growth(current_user: dict = Depends(get_current_user)):
    """
    Cumulative note count over the last 30 days.
    Drives the area chart showing overall workspace growth.
    """
    from app.routers.notes import _get_user_notes

    user_id = current_user["id"]
    notes   = _get_user_notes(user_id)
    now     = datetime.now(timezone.utc)

    # Count all notes created before each day's end
    points: list[NoteGrowthPoint] = []
    for delta in range(29, -1, -1):
        day_dt   = now - timedelta(days=delta)
        day_end  = day_dt.strftime("%Y-%m-%d") + "T23:59:59"
        day_str  = day_dt.strftime("%Y-%m-%d")
        count = sum(1 for n in notes if n["created_at"][:19] <= day_end)
        points.append(NoteGrowthPoint(date=day_str, cumulative_notes=count))

    return NoteGrowthResponse(points=points)


@router.get("/ai-trends", response_model=AITrendsResponse)
async def get_ai_trends(current_user: dict = Depends(get_current_user)):
    """
    AI generation counts per action per day for 14 days.
    Drives the stacked bar chart on the AI Insights page.
    """
    from app.repositories.ai_repository import _user_records

    user_id = current_user["id"]
    ai_recs = _user_records(user_id)
    now     = datetime.now(timezone.utc)

    # bucket: { (date, action): count }
    bucket: dict[tuple[str, str], int] = defaultdict(int)
    for rec in ai_recs:
        day = _date_str(rec["created_at"])
        cutoff = (now - timedelta(days=14)).strftime("%Y-%m-%d")
        if day >= cutoff:
            bucket[(day, rec["action"])] += 1

    points = [
        AITrendPoint(date=d, count=c, action=a)
        for (d, a), c in sorted(bucket.items())
    ]

    return AITrendsResponse(daily=points)