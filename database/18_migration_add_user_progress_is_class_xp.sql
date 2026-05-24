USE codequest;

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS is_class_xp TINYINT(1) NOT NULL DEFAULT 0 AFTER xp_earned;
