# backend/app/services/prompt_templates.py
"""
Centralised prompt template registry.

WHY a dedicated module:
- Prompts are product decisions, not implementation details. Keeping them
  separate means non-engineers can tune them without touching service logic.
- Parameterised with Python f-strings so content is injected safely.
- Each template explicitly instructs the model to return structured output,
  which makes parsing deterministic and avoids hallucinated schemas.
"""

from enum import Enum


class AIAction(str, Enum):
    SUMMARIZE = "summarize"
    EXTRACT_ACTION_ITEMS = "extract_action_items"
    GENERATE_TITLE = "generate_title"
    IMPROVE_WRITING = "improve_writing"
    CONVERT_TO_STUDY_NOTES = "convert_to_study_notes"
    GENERATE_FLASHCARDS = "generate_flashcards"
    GENERATE_QUIZ = "generate_quiz"
    SUGGEST_TAGS = "suggest_tags"
    EXPLAIN_CONTENT = "explain_content"
    SIMPLIFY = "simplify"


# Maximum characters we send to Gemini.
# Gemini 1.5 Flash supports 1M tokens, but sending entire novels is wasteful.
# 8 000 chars ≈ 2 000 tokens — plenty for notes.
MAX_CONTENT_CHARS = 8_000

_SYSTEM_PREAMBLE = (
    "You are an intelligent assistant embedded in a professional notes workspace. "
    "Be concise, accurate, and directly useful. Never add filler phrases like "
    "'Certainly!' or 'Of course!'. "
)


def _truncate(content: str) -> str:
    if len(content) <= MAX_CONTENT_CHARS:
        return content
    return content[:MAX_CONTENT_CHARS] + "\n\n[...content truncated for brevity]"


def build_prompt(action: AIAction, content: str, extra: dict | None = None) -> str:
    """Return the full prompt string for a given action + note content."""
    c = _truncate(content.strip())
    extra = extra or {}

    templates: dict[AIAction, str] = {
        AIAction.SUMMARIZE: (
            f"{_SYSTEM_PREAMBLE}"
            "Summarise the following note in 3–5 sentences. "
            "Capture the key ideas and omit filler. "
            "Return ONLY the summary text — no labels, no markdown headers.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.EXTRACT_ACTION_ITEMS: (
            f"{_SYSTEM_PREAMBLE}"
            "Extract every action item, task, or to-do from the note below. "
            "Return a JSON array of strings. Each string is one action item, "
            "written as an imperative sentence. "
            "If there are no action items, return an empty array [].\n"
            "Return ONLY valid JSON — no markdown fences, no explanation.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.GENERATE_TITLE: (
            f"{_SYSTEM_PREAMBLE}"
            "Generate a clear, specific title for this note (5 words max). "
            "Return ONLY the title text — no quotes, no punctuation at the end.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.IMPROVE_WRITING: (
            f"{_SYSTEM_PREAMBLE}"
            "Rewrite the following note with improved clarity, grammar, and flow. "
            "Preserve all original meaning and facts. "
            "Keep the same approximate length. "
            "Return ONLY the improved text.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.CONVERT_TO_STUDY_NOTES: (
            f"{_SYSTEM_PREAMBLE}"
            "Convert the following note into structured study notes. "
            "Use clear headings, bullet points for key facts, and bold for terms. "
            "Format as markdown. Return ONLY the markdown.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.GENERATE_FLASHCARDS: (
            f"{_SYSTEM_PREAMBLE}"
            "Generate study flashcards from the following note. "
            "Return a JSON array where each item has 'front' (question) and 'back' (answer). "
            "Aim for 5–10 cards covering the most important concepts. "
            "Return ONLY valid JSON — no markdown fences.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.GENERATE_QUIZ: (
            f"{_SYSTEM_PREAMBLE}"
            "Generate a short quiz from the following note. "
            "Return a JSON array where each item has: "
            "'question' (string), 'options' (array of 4 strings), 'answer' (correct option string). "
            "Aim for 3–5 questions. Return ONLY valid JSON — no markdown fences.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.SUGGEST_TAGS: (
            f"{_SYSTEM_PREAMBLE}"
            "Suggest 3–6 concise tags for this note. "
            "Tags should be lowercase, single words or short hyphenated phrases. "
            "Return a JSON array of strings. "
            "Return ONLY valid JSON — no markdown fences.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.EXPLAIN_CONTENT: (
            f"{_SYSTEM_PREAMBLE}"
            "Explain the following note content as if to someone unfamiliar with the topic. "
            "Use plain language, analogies where helpful, and short paragraphs. "
            "Return ONLY the explanation text.\n\n"
            f"NOTE:\n{c}"
        ),

        AIAction.SIMPLIFY: (
            f"{_SYSTEM_PREAMBLE}"
            "Rewrite the following note in the simplest possible language "
            "(target: a motivated high-school student). "
            "Remove jargon, define any unavoidable technical terms inline, "
            "and use short sentences. Return ONLY the simplified text.\n\n"
            f"NOTE:\n{c}"
        ),
    }

    return templates[action]


# Human-readable labels for frontend display
ACTION_LABELS: dict[AIAction, str] = {
    AIAction.SUMMARIZE: "Summarise",
    AIAction.EXTRACT_ACTION_ITEMS: "Extract Action Items",
    AIAction.GENERATE_TITLE: "Generate Title",
    AIAction.IMPROVE_WRITING: "Improve Writing",
    AIAction.CONVERT_TO_STUDY_NOTES: "Study Notes",
    AIAction.GENERATE_FLASHCARDS: "Flashcards",
    AIAction.GENERATE_QUIZ: "Quiz",
    AIAction.SUGGEST_TAGS: "Suggest Tags",
    AIAction.EXPLAIN_CONTENT: "Explain",
    AIAction.SIMPLIFY: "Simplify",
}

# Which actions return structured JSON vs plain text
JSON_ACTIONS: frozenset[AIAction] = frozenset({
    AIAction.EXTRACT_ACTION_ITEMS,
    AIAction.GENERATE_FLASHCARDS,
    AIAction.GENERATE_QUIZ,
    AIAction.SUGGEST_TAGS,
})