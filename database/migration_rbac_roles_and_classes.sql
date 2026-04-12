USE codequest;

-- 1) Normaliza enum de roles a user/instructor/admin
--    (mantiene compatibilidad temporal con student para poder migrar datos)
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('student', 'user', 'instructor', 'admin') NOT NULL DEFAULT 'user';

UPDATE `users`
SET `role` = 'user'
WHERE `role` = 'student';

ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('user', 'instructor', 'admin') NOT NULL DEFAULT 'user';

-- 2) Clases creadas por instructor
CREATE TABLE IF NOT EXISTS `instructor_classes` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `instructor_user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_instructor_user_id` (`instructor_user_id`),
  INDEX `idx_is_active` (`is_active`),
  FOREIGN KEY (`instructor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Relacion clase-estudiantes
CREATE TABLE IF NOT EXISTS `class_students` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `student_user_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'invited', 'removed') DEFAULT 'active',
  `joined_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_class_student` (`class_id`, `student_user_id`),
  INDEX `idx_student_user_id` (`student_user_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`class_id`) REFERENCES `instructor_classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Codigos de invitacion por clase
CREATE TABLE IF NOT EXISTS `class_invite_codes` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `invite_email` VARCHAR(255) NULL,
  `expires_at` DATETIME NULL,
  `max_uses` INT UNSIGNED NULL,
  `used_count` INT UNSIGNED DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by_user_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_invite_code` (`code`),
  INDEX `idx_class_id` (`class_id`),
  INDEX `idx_invite_email` (`invite_email`),
  INDEX `idx_is_active` (`is_active`),
  FOREIGN KEY (`class_id`) REFERENCES `instructor_classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Rutas asignadas por clase
CREATE TABLE IF NOT EXISTS `class_learning_paths` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `learning_path_id` INT UNSIGNED NOT NULL,
  `is_required` BOOLEAN DEFAULT TRUE,
  `assigned_by_user_id` INT UNSIGNED NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_class_learning_path` (`class_id`, `learning_path_id`),
  INDEX `idx_learning_path_id` (`learning_path_id`),
  INDEX `idx_is_required` (`is_required`),
  FOREIGN KEY (`class_id`) REFERENCES `instructor_classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
