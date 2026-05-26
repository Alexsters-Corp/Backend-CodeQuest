-- Add class XP marker to user progress.
-- This keeps regular dashboard XP separated from class-specific progress.

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS is_class_xp TINYINT(1) NOT NULL DEFAULT 0 AFTER xp_earned;

CREATE INDEX IF NOT EXISTS idx_user_progress_is_class_xp
  ON user_progress (is_class_xp);
