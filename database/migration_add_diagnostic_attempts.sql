USE codequest;

CREATE TABLE IF NOT EXISTS `user_diagnostic_attempts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `programming_language_id` INT UNSIGNED NOT NULL,
    `status` ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    `total_questions` INT UNSIGNED NOT NULL,
    `correct_answers` INT UNSIGNED DEFAULT 0,
    `weighted_score` DECIMAL(6,2) DEFAULT 0.00,
    `score_percentage` DECIMAL(5,2) DEFAULT 0.00,
    `assigned_level` ENUM('principiante', 'intermedio', 'avanzado') NULL,
    `assigned_path_id` INT UNSIGNED NULL,
    `answers_json` LONGTEXT NULL,
    `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_user_language` (`user_id`, `programming_language_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_completed_at` (`completed_at`),
    CONSTRAINT `fk_diag_attempt_user`
      FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_diag_attempt_language`
      FOREIGN KEY (`programming_language_id`) REFERENCES `programming_languages`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_diag_attempt_path`
      FOREIGN KEY (`assigned_path_id`) REFERENCES `learning_paths`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
