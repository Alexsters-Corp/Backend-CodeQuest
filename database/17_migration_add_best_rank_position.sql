USE codequest;

ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS best_rank_position INT UNSIGNED NULL AFTER rank_position;

CREATE INDEX idx_best_rank_position ON user_stats (best_rank_position);
