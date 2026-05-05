-- g:/IUP - Yamith Alexander Ardila Cabrera/PSW3/CodeQuest Project/Backend-CodeQuest/database/14_migration_create_ai_evaluations.sql
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id           CHAR(36)     NOT NULL,
  exercise_id       CHAR(36)     NOT NULL,
  ai_model_used     VARCHAR(100) NOT NULL COMMENT 'e.g. llama-3.3-70b',
  judge0_status_id  TINYINT      NOT NULL COMMENT 'Judge0 status code (3=Accepted, etc.)',
  judge0_output     TEXT         NULL     COMMENT 'Raw stdout from Judge0',
  evaluation_result JSON         NOT NULL COMMENT '{ passed, score, feedback, conceptUnderstood }',
  confidence_score  DECIMAL(3,2) NOT NULL DEFAULT 0.00 COMMENT '0.00 to 1.00',
  concept_understood BOOLEAN     NOT NULL DEFAULT FALSE,
  flagged_for_review BOOLEAN     NOT NULL DEFAULT FALSE COMMENT 'True if Judge0=pass but AI suspects copy/hardcode',
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id     (user_id),
  INDEX idx_exercise_id (exercise_id),
  INDEX idx_flagged     (flagged_for_review),
  INDEX idx_created_at  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
