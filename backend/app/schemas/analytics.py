# backend/app/schemas/analytics.py
# WHY typed response models: Pydantic v2 validates the shape before it hits the wire,
# so a bug in analytics calculation raises a 500 internally — not a malformed JSON to the client.

from pydantic import BaseModel
from typing import Optional


class DailyActivity(BaseModel):
    date: str          # "2026-05-11"
    notes_created: int
    notes_edited: int
    ai_generations: int


class TagStat(BaseModel):
    name: str
    color: str
    count: int         # number of notes using this tag


class AnalyticsSummaryResponse(BaseModel):
    # Counts
    total_notes: int
    archived_notes: int
    public_notes: int
    notes_this_week: int
    notes_this_month: int

    # AI
    total_ai_generations: int
    ai_generations_this_week: int
    notes_with_ai_summary: int
    most_used_ai_action: Optional[str]
    ai_action_breakdown: dict[str, int]

    # Tags
    total_tags: int
    top_tags: list[TagStat]

    # Content
    avg_note_length: int           # words
    longest_note_words: int
    total_words_written: int

    # Streaks (computed from daily activity)
    current_streak_days: int
    longest_streak_days: int


class WeeklyActivityResponse(BaseModel):
    days: list[DailyActivity]      # always 7 items, oldest → newest
    total_notes_created: int
    total_ai_generations: int
    most_active_day: Optional[str]


class NoteGrowthPoint(BaseModel):
    date: str
    cumulative_notes: int


class NoteGrowthResponse(BaseModel):
    points: list[NoteGrowthPoint]  # 30 days


class AITrendPoint(BaseModel):
    date: str
    count: int
    action: str    # "summary" | "action_items" | "title"


class AITrendsResponse(BaseModel):
    daily: list[AITrendPoint]      # 14 days, one row per (date, action)