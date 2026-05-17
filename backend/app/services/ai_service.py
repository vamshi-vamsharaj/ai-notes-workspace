# backend/app/services/ai_service.py
"""
AI Service — the only place in the codebase that talks to Gemini.

Architecture decisions:
- Single responsibility: this class handles ONE thing — call Gemini and return
  a parsed result. Prompt construction lives in prompt_templates.py.
  Persistence lives in ai_repository.py. The router orchestrates them.
- Async via asyncio.to_thread: google-generativeai's Python SDK is synchronous.
  Rather than blocking the event loop, we run it in a thread pool.
- Retry with exponential backoff: Gemini rate-limits at the project level.
  3 retries with 1s/2s/4s delays covers transient 429s without hammering the API.
- Hard timeout: AI calls can hang. We enforce a 30-second ceiling so a slow
  Gemini response never blocks a FastAPI worker indefinitely.
- Structured parsing: JSON-returning actions are parsed here. If parsing fails,
  we return a clear error rather than silently returning malformed data.
"""

import asyncio
import json
import logging
import time
from typing import Any

import google.generativeai as genai
from google.generativeai.types import HarmBlockThreshold, HarmCategory

from app.config import settings
from app.services.prompt_templates import AIAction, JSON_ACTIONS, build_prompt

logger = logging.getLogger(__name__)

# Configure once at import time — idempotent.
genai.configure(api_key=settings.GEMINI_API_KEY)

# Safety settings — relaxed for a notes workspace so benign content isn't blocked.
_SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
}

_GENERATION_CONFIG = genai.GenerationConfig(
    temperature=0.4,      # Slightly creative but mostly deterministic
    top_p=0.95,
    max_output_tokens=2048,
)


class AIServiceError(Exception):
    """Raised when the AI service cannot produce a usable result."""
    def __init__(self, message: str, retriable: bool = False):
        super().__init__(message)
        self.retriable = retriable


class AIService:
    """Stateless service. Instantiate once per request via DI."""

    MODEL_NAME = "gemini-2.5-flash"   # Fast + cheap. Swap to gemini-1.5-pro for quality.
    TIMEOUT_SECONDS = 30
    MAX_RETRIES = 3
    BASE_BACKOFF = 1.0                # seconds; doubles each retry

    def __init__(self) -> None:
        self._model = genai.GenerativeModel(
            model_name=self.MODEL_NAME,
            generation_config=_GENERATION_CONFIG,
            safety_settings=_SAFETY_SETTINGS,
        )

    async def generate(
        self,
        action: AIAction,
        content: str,
        extra: dict | None = None,
    ) -> dict[str, Any]:
        """
        Main entry point. Returns a dict with:
          result   — the parsed output (str | list | dict)
          action   — the action enum value
          raw_text — the raw Gemini response text (for logging)
          tokens   — approximate token count
        """
        if not content or not content.strip():
            raise AIServiceError("Note content is empty — nothing to process.")

        prompt = build_prompt(action, content, extra)
        raw_text, tokens = await self._call_with_retry(prompt)
        result = self._parse_result(action, raw_text)

        return {
            "result": result,
            "action": action.value,
            "raw_text": raw_text,
            "tokens_used": tokens,
        }

    async def _call_with_retry(self, prompt: str) -> tuple[str, int]:
        """Call Gemini with retry + timeout. Returns (text, token_count)."""
        last_error: Exception | None = None

        for attempt in range(self.MAX_RETRIES):
            try:
                text, tokens = await asyncio.wait_for(
                    asyncio.to_thread(self._call_gemini_sync, prompt),
                    timeout=self.TIMEOUT_SECONDS,
                )
                return text, tokens

            except asyncio.TimeoutError:
                last_error = AIServiceError(
                    f"Gemini did not respond within {self.TIMEOUT_SECONDS}s.",
                    retriable=True,
                )
                logger.warning("Gemini timeout on attempt %d/%d", attempt + 1, self.MAX_RETRIES)

            except Exception as exc:
                error_str = str(exc).lower()
                is_rate_limit = "429" in error_str or "quota" in error_str or "rate" in error_str
                last_error = AIServiceError(str(exc), retriable=is_rate_limit)
                logger.warning(
                    "Gemini error on attempt %d/%d: %s",
                    attempt + 1, self.MAX_RETRIES, exc,
                )
                if not is_rate_limit:
                    break  # Non-retriable — stop immediately

            # Exponential backoff before next attempt
            backoff = self.BASE_BACKOFF * (2 ** attempt)
            await asyncio.sleep(backoff)

        raise last_error or AIServiceError("Unknown AI service error")

    def _call_gemini_sync(self, prompt: str) -> tuple[str, int]:
        """Synchronous Gemini call — runs inside a thread via asyncio.to_thread."""
        t0 = time.perf_counter()
        response = self._model.generate_content(prompt)
        elapsed = time.perf_counter() - t0

        # Extract text safely
        if not response.candidates:
            raise AIServiceError("Gemini returned no candidates — content may be blocked.")

        text = response.text.strip()

        # Token count — available on response.usage_metadata (may be None on some versions)
        try:
            tokens = response.usage_metadata.total_token_count or 0
        except AttributeError:
            tokens = len(prompt.split()) + len(text.split())  # rough estimate

        logger.debug("Gemini responded in %.2fs, ~%d tokens", elapsed, tokens)
        return text, tokens

    def _parse_result(self, action: AIAction, raw_text: str) -> Any:
        """
        For JSON-returning actions, parse and validate the response.
        For text actions, return the string directly.
        """
        if action not in JSON_ACTIONS:
            return raw_text

        # Strip markdown code fences if the model wrapped JSON in them
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1]).strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse JSON from Gemini: %s\nRaw: %s", exc, raw_text[:500])
            raise AIServiceError(
                "AI returned malformed output. Please retry.",
                retriable=True,
            )

        return parsed


# Module-level singleton — constructed once, shared across requests.
# This is safe because AIService is stateless.
ai_service = AIService()