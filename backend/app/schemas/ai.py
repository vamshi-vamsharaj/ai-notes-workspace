# backend/app/schemas/ai.py
"""
Pydantic v2 schemas for the AI router.

WHY separate request/response schemas for AI:
- The AI router has very different payload shapes from CRUD routes.
- Keeping them here prevents the notes schema file from becoming a dumping ground.
- response_model on every route means FastAPI auto-documents and validates output.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.services.prompt_templates import AIAction


# ── Request schemas ───────────────────────────────────────────────────────────

class AIGenerateRequest(BaseModel):
    note_id: UUID
    action: AIAction
    content: str = Field(..., min_length=1, max_length=50_000)

    @field_validator("content")
    @classmethod
    def content_not_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be empty or whitespace only.")
        return v


# ── Response schemas ──────────────────────────────────────────────────────────

class AIGenerateResponse(BaseModel):
    id: UUID
    note_id: UUID
    action: str
    result: Any          # str | list | dict depending on action
    tokens_used: int
    created_at: datetime
    cached: bool = False


class AIGenerationHistoryItem(BaseModel):
    id: UUID
    note_id: UUID
    action: str
    result: Any
    tokens_used: int
    created_at: datetime


class AIGenerationHistoryResponse(BaseModel):
    items: list[AIGenerationHistoryItem]
    total: int


class AIUsageStatsResponse(BaseModel):
    total_generations: int
    total_tokens_used: int
    generations_this_week: int
    most_used_action: str | None
    action_breakdown: dict[str, int]


# Flashcard shape (used for frontend type safety)
class Flashcard(BaseModel):
    front: str
    back: str


# Quiz question shape
class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer: str