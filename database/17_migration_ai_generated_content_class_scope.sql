-- Scope AI published content to a specific class when published by instructors.

ALTER TABLE ai_generated_content
  ADD COLUMN IF NOT EXISTS class_id BIGINT UNSIGNED NULL AFTER published_lesson_id,
  ADD INDEX idx_ai_generated_content_class_id (class_id);

ALTER TABLE ai_generated_content
  ADD CONSTRAINT fk_ai_generated_content_class
  FOREIGN KEY (class_id)
  REFERENCES instructor_classes(id)
  ON DELETE SET NULL;