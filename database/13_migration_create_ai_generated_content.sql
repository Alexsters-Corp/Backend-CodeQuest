-- g:/IUP - Yamith Alexander Ardila Cabrera/PSW3/CodeQuest Project/Backend-CodeQuest/database/13_migration_create_ai_generated_content.sql
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id            CHAR(36)          NOT NULL DEFAULT (UUID()),
  topic         VARCHAR(255)      NOT NULL,
  language      VARCHAR(50)       NOT NULL COMMENT 'e.g. javascript, python, java',
  original_content JSON           NOT NULL COMMENT 'Full structured lesson/exercise object',
  validated_by  ENUM('ai','instructor','admin') NOT NULL DEFAULT 'ai',
  quality_score DECIMAL(3,2)      NOT NULL DEFAULT 0.00 COMMENT '0.00 to 1.00',
  difficulty_level ENUM('beginner','intermediate','advanced') NOT NULL,
  ai_model_used VARCHAR(100)      NOT NULL COMMENT 'e.g. llama-3.3-70b',
  judge0_validated BOOLEAN        NOT NULL DEFAULT FALSE,
  published     BOOLEAN           NOT NULL DEFAULT FALSE,
  generated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by    CHAR(36)          NULL COMMENT 'instructor/admin user_id who triggered generation',
  PRIMARY KEY (id),
  INDEX idx_difficulty  (difficulty_level),
  INDEX idx_published   (published),
  INDEX idx_created_by  (created_by),
  INDEX idx_language    (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
