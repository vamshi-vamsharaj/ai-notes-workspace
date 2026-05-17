-- backend/app/database/ai_schema.sql
-- Run this in your Supabase SQL editor to create the AI tables.
-- These replace the in-memory store in ai_repository.py when you wire up SQLAlchemy.

-- ── ai_generations ───────────────────────────────────────────────────────────
-- One row per AI generation request. This is the source of truth for
-- history, analytics, and auditing.

CREATE TABLE IF NOT EXISTS ai_generations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_id       UUID REFERENCES notes(id) ON DELETE SET NULL,

  action        TEXT NOT NULL,          -- matches AIAction enum values
  result        JSONB,                  -- parsed output (text, array, or object)
  raw_text      TEXT,                   -- raw Gemini response (for debugging)
  tokens_used   INTEGER DEFAULT 0,

  -- For future caching: skip Gemini if same note+action+content_hash was generated recently
  content_hash  TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id + created_at for pagination and analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_created
  ON ai_generations(user_id, created_at DESC);

-- Index on note_id for fetching a note's history
CREATE INDEX IF NOT EXISTS idx_ai_generations_note
  ON ai_generations(note_id) WHERE note_id IS NOT NULL;

-- Index on action for breakdown analytics
CREATE INDEX IF NOT EXISTS idx_ai_generations_action
  ON ai_generations(user_id, action);


-- ── ai_usage_tracking ────────────────────────────────────────────────────────
-- Aggregated daily rollup. Updated by a Supabase Edge Function or cron job.
-- Keeps analytics queries O(1) instead of O(n) over ai_generations.

CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date           DATE NOT NULL,          -- UTC date
  action         TEXT NOT NULL,
  request_count  INTEGER DEFAULT 0,
  tokens_used    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date, action)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date
  ON ai_usage_tracking(user_id, date DESC);


-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own generations"
  ON ai_generations FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage"
  ON ai_usage_tracking FOR ALL
  USING (auth.uid() = user_id);