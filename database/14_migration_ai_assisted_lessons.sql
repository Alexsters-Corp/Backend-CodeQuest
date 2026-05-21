-- Migration 14: mark lessons published from AI-assisted content.

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS is_ai_assisted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Contenido generado o publicado con asistencia de IA' AFTER is_published;

ALTER TABLE ai_generated_content
  ADD COLUMN IF NOT EXISTS published_lesson_id INT UNSIGNED NULL AFTER published,
  ADD INDEX idx_published_lesson_id (published_lesson_id);
