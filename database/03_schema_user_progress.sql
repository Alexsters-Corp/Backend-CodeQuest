-- Schema incremental para HU-007 (Vista de Leccion - Teoria)
-- Crea/asegura tablas de progreso de usuario y lecciones para el Learning Core.

USE codequest;

CREATE TABLE IF NOT EXISTS lessons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  learning_path_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  content LONGTEXT NOT NULL,
  order_position INT UNSIGNED NOT NULL,
  estimated_minutes INT UNSIGNED DEFAULT 30,
  is_published TINYINT(1) DEFAULT 0,
  is_free_demo TINYINT(1) DEFAULT 0,
  xp_reward INT UNSIGNED DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_learning_path FOREIGN KEY (learning_path_id)
    REFERENCES learning_paths(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE KEY unique_path_order (learning_path_id, order_position),
  UNIQUE KEY unique_slug_path (learning_path_id, slug),
  INDEX idx_learning_path_id (learning_path_id),
  INDEX idx_is_published (is_published),
  INDEX idx_order_position (order_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  lesson_id INT UNSIGNED NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  xp_earned INT UNSIGNED DEFAULT 0,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  last_accessed_at DATETIME NULL,
  submission_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_progress_lesson FOREIGN KEY (lesson_id)
    REFERENCES lessons(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE KEY unique_user_lesson (user_id, lesson_id),
  INDEX idx_user_id (user_id),
  INDEX idx_lesson_id (lesson_id),
  INDEX idx_status (status),
  INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
