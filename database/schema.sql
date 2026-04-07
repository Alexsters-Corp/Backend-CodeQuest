-- ============================================================
-- CODEQUEST - DATABASE SCHEMA COMPLETO
-- ============================================================
-- Version: 2.0 Final (Produccion)
-- Cubre: Sprints 1-5 (Auth, Learning, Execution, Gamification, Admin)
-- Motor: MySQL 8.0+ / MariaDB 10.4+
-- Normalizacion: 3NF
-- Charset: utf8mb4_unicode_ci
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================
-- CREAR BASE DE DATOS
-- ============================================================
CREATE DATABASE IF NOT EXISTS `codequest`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `codequest`;

-- ============================================================
-- TABLA: users
-- Descripcion: Usuarios registrados (Sprint 1 - EPIC-01)
-- ============================================================
CREATE TABLE `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NULL UNIQUE,
    `bio` TEXT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `role` ENUM('student', 'admin', 'instructor') DEFAULT 'student',
    `email_verified` BOOLEAN DEFAULT FALSE,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_email` (`email`),
    INDEX `idx_username` (`username`),
    INDEX `idx_role` (`role`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: programming_languages
-- Descripcion: Lenguajes soportados (Sprint 1-5)
-- ============================================================
CREATE TABLE `programming_languages` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `display_name` VARCHAR(100) NOT NULL,
    `logo_url` VARCHAR(500) NULL,
    `judge0_language_id` INT UNSIGNED NOT NULL,
    `file_extension` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_slug` (`slug`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_judge0_id` (`judge0_language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: learning_paths
-- Descripcion: Rutas de aprendizaje (YA EXISTE - Actualizada)
-- ============================================================
CREATE TABLE `learning_paths` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `programming_language_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `difficulty_level` ENUM('principiante', 'intermedio', 'avanzado') DEFAULT 'principiante',
    `estimated_hours` INT UNSIGNED DEFAULT 40,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`programming_language_id`) REFERENCES `programming_languages`(`id`) ON DELETE CASCADE,
    INDEX `idx_programming_language_id` (`programming_language_id`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_difficulty` (`difficulty_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: user_learning_paths
-- Descripcion: Ruta seleccionada por usuario (Sprint 2 - HU-006)
-- ============================================================
CREATE TABLE `user_learning_paths` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `learning_path_id` INT UNSIGNED NOT NULL,
    `progress_percentage` DECIMAL(5,2) DEFAULT 0.00,
    `selected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_accessed_at` DATETIME NULL,
    `completed_at` DATETIME NULL,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON DELETE RESTRICT,
    UNIQUE KEY `unique_user_path` (`user_id`, `learning_path_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_learning_path_id` (`learning_path_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: lessons
-- Descripcion: Contenido de lecciones (Sprint 2 - HU-007)
-- ============================================================
CREATE TABLE `lessons` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `learning_path_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `content` LONGTEXT NOT NULL COMMENT 'Contenido teorico Markdown/HTML',
    `order_position` INT UNSIGNED NOT NULL,
    `estimated_minutes` INT UNSIGNED DEFAULT 30,
    `is_published` BOOLEAN DEFAULT FALSE,
    `is_free_demo` BOOLEAN DEFAULT FALSE COMMENT 'Accesible sin auth',
    `xp_reward` INT UNSIGNED DEFAULT 50,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_path_order` (`learning_path_id`, `order_position`),
    UNIQUE KEY `unique_slug_path` (`learning_path_id`, `slug`),
    INDEX `idx_learning_path_id` (`learning_path_id`),
    INDEX `idx_is_published` (`is_published`),
    INDEX `idx_is_free_demo` (`is_free_demo`),
    INDEX `idx_order_position` (`order_position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: lesson_test_cases
-- Descripcion: Casos de prueba para validacion (Sprint 3 - HU-014)
-- ============================================================
CREATE TABLE `lesson_test_cases` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `lesson_id` INT UNSIGNED NOT NULL,
    `input_data` TEXT NOT NULL,
    `expected_output` TEXT NOT NULL,
    `is_hidden` BOOLEAN DEFAULT FALSE COMMENT 'No mostrar al usuario',
    `points` INT UNSIGNED DEFAULT 10,
    `order_position` INT UNSIGNED NOT NULL,
    `timeout_ms` INT UNSIGNED DEFAULT 5000,
    `memory_limit_kb` INT UNSIGNED DEFAULT 256000,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
    INDEX `idx_lesson_id` (`lesson_id`),
    INDEX `idx_is_hidden` (`is_hidden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: lesson_solutions
-- Descripcion: Soluciones oficiales (Sprint 2 - HU-011)
-- ============================================================
CREATE TABLE `lesson_solutions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `lesson_id` INT UNSIGNED NOT NULL UNIQUE,
    `solution_code` LONGTEXT NOT NULL,
    `explanation` TEXT NULL,
    `language_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`language_id`) REFERENCES `programming_languages`(`id`) ON DELETE RESTRICT,
    INDEX `idx_lesson_id` (`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: user_progress
-- Descripcion: Progreso del usuario (Sprint 2 - HU-008)
-- ============================================================
CREATE TABLE `user_progress` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `lesson_id` INT UNSIGNED NOT NULL,
    `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    `xp_earned` INT UNSIGNED DEFAULT 0,
    `started_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `last_accessed_at` DATETIME NULL,
    `submission_count` INT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_lesson` (`user_id`, `lesson_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_lesson_id` (`lesson_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_completed_at` (`completed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: user_submissions
-- Descripcion: Envios de codigo Judge0 (Sprint 3 - HU-012/013)
-- ============================================================
CREATE TABLE `user_submissions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `lesson_id` INT UNSIGNED NOT NULL,
    `code_submitted` LONGTEXT NOT NULL,
    `language_id` INT UNSIGNED NOT NULL,
    `status` ENUM('pending', 'accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'timeout', 'memory_limit') DEFAULT 'pending',
    `execution_time_ms` INT UNSIGNED NULL,
    `memory_used_kb` INT UNSIGNED NULL,
    `judge0_submission_id` VARCHAR(255) NULL,
    `judge0_token` VARCHAR(255) NULL,
    `stdout` TEXT NULL,
    `stderr` TEXT NULL,
    `compile_output` TEXT NULL,
    `error_message` TEXT NULL,
    `test_cases_passed` INT UNSIGNED DEFAULT 0,
    `test_cases_total` INT UNSIGNED DEFAULT 0,
    `points_earned` INT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`language_id`) REFERENCES `programming_languages`(`id`) ON DELETE RESTRICT,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_lesson_id` (`lesson_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_judge0_id` (`judge0_submission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: user_favorites
-- Descripcion: Lecciones favoritas (Sprint 2 - HU-010)
-- ============================================================
CREATE TABLE `user_favorites` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `lesson_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_lesson_favorite` (`user_id`, `lesson_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_lesson_id` (`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: user_stats
-- Descripcion: Estadisticas XP/niveles (Sprint 4 - HU-016)
-- ============================================================
CREATE TABLE `user_stats` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE,
    `total_xp` INT UNSIGNED DEFAULT 0,
    `current_level` INT UNSIGNED DEFAULT 1,
    `lessons_completed` INT UNSIGNED DEFAULT 0,
    `submissions_total` INT UNSIGNED DEFAULT 0,
    `submissions_accepted` INT UNSIGNED DEFAULT 0,
    `streak_current` INT UNSIGNED DEFAULT 0,
    `streak_longest` INT UNSIGNED DEFAULT 0,
    `rank_position` INT UNSIGNED NULL,
    `last_activity_date` DATE NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_total_xp` (`total_xp`),
    INDEX `idx_current_level` (`current_level`),
    INDEX `idx_rank_position` (`rank_position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: achievements
-- Descripcion: Logros/insignias (Sprint 4 - HU-018)
-- ============================================================
CREATE TABLE `achievements` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `icon_url` VARCHAR(500) NULL,
    `requirement_type` ENUM('lessons_completed', 'streak_days', 'xp_total', 'submissions', 'submissions_accepted', 'level_reached') NOT NULL,
    `requirement_value` INT UNSIGNED NOT NULL,
    `points` INT UNSIGNED DEFAULT 50,
    `badge_color` VARCHAR(20) DEFAULT '#FFD700',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_slug` (`slug`),
    INDEX `idx_requirement_type` (`requirement_type`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: user_achievements
-- Descripcion: Logros desbloqueados (Sprint 4 - HU-018)
-- ============================================================
CREATE TABLE `user_achievements` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `achievement_id` INT UNSIGNED NOT NULL,
    `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `xp_bonus` INT UNSIGNED DEFAULT 0,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_achievement` (`user_id`, `achievement_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_achievement_id` (`achievement_id`),
    INDEX `idx_unlocked_at` (`unlocked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: password_resets
-- Descripcion: Recuperacion contrasena (Sprint 1 - HU-003)
-- ============================================================
CREATE TABLE `password_resets` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL UNIQUE,
    `expires_at` DATETIME NOT NULL,
    `used` BOOLEAN DEFAULT FALSE,
    `used_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_token_hash` (`token_hash`),
    INDEX `idx_expires_at` (`expires_at`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: email_verifications
-- Descripcion: Verificacion email (Sprint 2 - HU-026)
-- ============================================================
CREATE TABLE `email_verifications` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE,
    `token_hash` VARCHAR(255) NOT NULL UNIQUE,
    `expires_at` DATETIME NOT NULL,
    `verified` BOOLEAN DEFAULT FALSE,
    `verified_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_token_hash` (`token_hash`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: token_blacklist
-- Descripcion: Tokens JWT invalidados (Sprint 1 - HU-005)
-- ============================================================
CREATE TABLE `token_blacklist` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `token_jti` VARCHAR(255) NOT NULL UNIQUE,
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_token_jti` (`token_jti`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: notifications
-- Descripcion: Notificaciones (Sprint 4 - HU-027/028)
-- ============================================================
CREATE TABLE `notifications` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `type` ENUM('streak_warning', 'inactivity_reminder', 'achievement_unlocked', 'lesson_completed', 'system') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `read_at` DATETIME NULL,
    `action_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_is_read` (`is_read`),
    INDEX `idx_type` (`type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: admin_audit_log
-- Descripcion: Auditoria admin (Sprint 5 - EPIC-05)
-- ============================================================
CREATE TABLE `admin_audit_log` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `admin_user_id` INT UNSIGNED NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` INT UNSIGNED NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_admin_user_id` (`admin_user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: system_settings
-- Descripcion: Configuracion global (Todos los sprints)
-- ============================================================
CREATE TABLE `system_settings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT NULL,
    `setting_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    `description` TEXT NULL,
    `is_public` BOOLEAN DEFAULT FALSE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_setting_key` (`setting_key`),
    INDEX `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS INICIALES - Programming Languages (7 lenguajes)
-- ============================================================
INSERT INTO `programming_languages` (`name`, `slug`, `display_name`, `logo_url`, `judge0_language_id`, `file_extension`, `is_active`) VALUES
('Python', 'python', 'Python 3.11', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', 71, '.py', TRUE),
('JavaScript', 'javascript', 'JavaScript (Node.js 18)', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', 63, '.js', TRUE),
('Java', 'java', 'Java 17', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg', 62, '.java', TRUE),
('C++', 'cpp', 'C++ (GCC 11)', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg', 54, '.cpp', TRUE),
('C#', 'csharp', 'C# (.NET 7)', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg', 51, '.cs', TRUE),
('Go', 'go', 'Go 1.21', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg', 60, '.go', TRUE),
('Ruby', 'ruby', 'Ruby 3.2', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg', 72, '.rb', TRUE);

-- ============================================================
-- DATOS INICIALES - Learning Paths (Mantiene tus datos existentes)
-- ============================================================
INSERT INTO `learning_paths` (`programming_language_id`, `name`, `slug`, `description`, `difficulty_level`, `estimated_hours`, `is_active`) VALUES
(1, 'Python desde Cero', 'python-basics', 'Aprende Python desde los fundamentos hasta conceptos intermedios', 'principiante', 40, TRUE),
(1, 'Python Intermedio', 'python-intermediate', 'Domina estructuras de datos y algoritmos en Python', 'intermedio', 60, TRUE),
(2, 'JavaScript Esencial', 'javascript-essentials', 'Domina JavaScript para desarrollo web moderno', 'principiante', 45, TRUE),
(2, 'JavaScript Avanzado', 'javascript-advanced', 'Patrones avanzados y mejores practicas en JavaScript', 'avanzado', 70, TRUE),
(3, 'Java Fundamentos', 'java-fundamentals', 'Introduccion a Java y programacion orientada a objetos', 'principiante', 50, TRUE),
(4, 'C++ para Principiantes', 'cpp-basics', 'Aprende C++ desde cero con ejercicios practicos', 'principiante', 55, TRUE),
(5, 'C# y .NET', 'csharp-dotnet', 'Desarrollo de aplicaciones con C# y .NET', 'intermedio', 60, TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- DATOS INICIALES - Achievements (Sprint 4)
-- ============================================================
INSERT INTO `achievements` (`name`, `slug`, `description`, `requirement_type`, `requirement_value`, `points`, `badge_color`, `is_active`) VALUES
('Primera Leccion', 'first-lesson', 'Completa tu primera leccion', 'lessons_completed', 1, 10, '#FFD700', TRUE),
('Constante', 'streak-7', '7 dias de racha consecutiva', 'streak_days', 7, 50, '#FF6B35', TRUE),
('Dedicado', 'streak-30', '30 dias de racha consecutiva', 'streak_days', 30, 200, '#FF4500', TRUE),
('Explorador', 'lessons-10', 'Completa 10 lecciones', 'lessons_completed', 10, 100, '#4CAF50', TRUE),
('Maestro', 'lessons-50', 'Completa 50 lecciones', 'lessons_completed', 50, 500, '#9C27B0', TRUE),
('Persistente', 'submissions-100', '100 envios de codigo', 'submissions', 100, 150, '#2196F3', TRUE),
('XP Novato', 'xp-500', 'Alcanza 500 XP', 'xp_total', 500, 75, '#FFC107', TRUE),
('XP Intermedio', 'xp-2000', 'Alcanza 2000 XP', 'xp_total', 2000, 200, '#FF9800', TRUE),
('XP Experto', 'xp-5000', 'Alcanza 5000 XP', 'xp_total', 5000, 500, '#F44336', TRUE),
('Nivel 5', 'level-5', 'Alcanza el nivel 5', 'level_reached', 5, 100, '#673AB7', TRUE),
('Nivel 10', 'level-10', 'Alcanza el nivel 10', 'level_reached', 10, 250, '#3F51B5', TRUE),
('Perfecto', 'submissions-accepted-50', '50 envios aceptados', 'submissions_accepted', 50, 300, '#00BCD4', TRUE);

-- ============================================================
-- DATOS INICIALES - System Settings (Feature Flags)
-- ============================================================
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
('FEATURE_AUTH_ENABLED', 'true', 'boolean', 'Habilitar sistema de autenticacion', FALSE),
('FEATURE_LEARNING_CORE_ENABLED', 'true', 'boolean', 'Habilitar nucleo de aprendizaje', FALSE),
('FEATURE_CODE_EXECUTION_ENABLED', 'true', 'boolean', 'Habilitar ejecucion de codigo (Judge0)', FALSE),
('FEATURE_GAMIFICATION_ENABLED', 'true', 'boolean', 'Habilitar gamificacion (XP, logros)', FALSE),
('FEATURE_GUEST_ACCESS_ENABLED', 'true', 'boolean', 'Habilitar acceso para invitados', FALSE),
('FEATURE_ADMIN_ENABLED', 'true', 'boolean', 'Habilitar panel de administracion', FALSE),
('FEATURE_NOTIFICATIONS_ENABLED', 'true', 'boolean', 'Habilitar notificaciones', FALSE),
('JUDGE0_API_URL', 'https://ce.judge0.com', 'string', 'URL de la API de Judge0', FALSE),
('JUDGE0_API_KEY', '', 'string', 'API Key de Judge0', FALSE),
('XP_PER_LESSON', '50', 'number', 'XP base por leccion completada', FALSE),
('STREAK_RESET_HOUR', '0', 'number', 'Hora del dia para resetear rachas (UTC)', FALSE),
('INACTIVITY_DAYS_THRESHOLD', '7', 'number', 'Dias de inactividad para enviar recordatorio', FALSE)
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- ============================================================
-- VISTA: user_lesson_progress
-- ============================================================
CREATE OR REPLACE VIEW `user_lesson_progress` AS
SELECT
    u.id AS user_id,
    u.email,
    u.name,
    u.username,
    l.id AS lesson_id,
    l.title AS lesson_title,
    l.slug AS lesson_slug,
    lp.id AS learning_path_id,
    lp.name AS learning_path_name,
    pl.id AS language_id,
    pl.display_name AS programming_language,
    up.status,
    up.xp_earned,
    up.started_at,
    up.completed_at,
    up.last_accessed_at,
    up.submission_count
FROM users u
LEFT JOIN user_learning_paths ulp ON u.id = ulp.user_id
LEFT JOIN learning_paths lp ON ulp.learning_path_id = lp.id
LEFT JOIN programming_languages pl ON lp.programming_language_id = pl.id
LEFT JOIN lessons l ON lp.id = l.learning_path_id
LEFT JOIN user_progress up ON u.id = up.user_id AND l.id = up.lesson_id
WHERE u.is_active = TRUE;

-- ============================================================
-- VISTA: user_statistics
-- ============================================================
CREATE OR REPLACE VIEW `user_statistics` AS
SELECT
    u.id AS user_id,
    u.email,
    u.name,
    u.username,
    u.avatar_url,
    u.role,
    us.total_xp,
    us.current_level,
    us.lessons_completed,
    us.submissions_total,
    us.submissions_accepted,
    us.streak_current,
    us.streak_longest,
    us.rank_position,
    COUNT(DISTINCT uf.lesson_id) AS favorite_lessons,
    COUNT(DISTINCT ua.achievement_id) AS achievements_unlocked,
    ROUND(us.submissions_accepted * 100.0 / NULLIF(us.submissions_total, 0), 2) AS acceptance_rate,
    lp.name AS current_learning_path,
    pl.display_name AS primary_language
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN user_learning_paths ulp ON u.id = ulp.user_id
LEFT JOIN learning_paths lp ON ulp.learning_path_id = lp.id
LEFT JOIN programming_languages pl ON lp.programming_language_id = pl.id
LEFT JOIN user_favorites uf ON u.id = uf.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.email, u.name, u.username, u.avatar_url, u.role,
         us.total_xp, us.current_level, us.lessons_completed,
         us.submissions_total, us.submissions_accepted,
         us.streak_current, us.streak_longest, us.rank_position,
         lp.name, pl.display_name;

-- ============================================================
-- VISTA: leaderboard
-- ============================================================
CREATE OR REPLACE VIEW `leaderboard` AS
SELECT
    u.id AS user_id,
    u.name,
    u.username,
    u.avatar_url,
    us.total_xp,
    us.current_level,
    us.lessons_completed,
    us.streak_current,
    ROW_NUMBER() OVER (ORDER BY us.total_xp DESC, us.lessons_completed DESC, us.streak_current DESC) AS rank_position,
    pl.display_name AS primary_language,
    lp.name AS learning_path
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN user_learning_paths ulp ON u.id = ulp.user_id
LEFT JOIN learning_paths lp ON ulp.learning_path_id = lp.id
LEFT JOIN programming_languages pl ON lp.programming_language_id = pl.id
WHERE u.is_active = TRUE
ORDER BY us.total_xp DESC, us.lessons_completed DESC;

-- ============================================================
-- STORED PROCEDURE: sp_complete_lesson
-- ============================================================
DELIMITER //

CREATE PROCEDURE `sp_complete_lesson`(
    IN p_user_id INT UNSIGNED,
    IN p_lesson_id INT UNSIGNED,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_xp_earned INT UNSIGNED,
    OUT p_new_level INT UNSIGNED
)
BEGIN
    DECLARE v_learning_path_id INT UNSIGNED;
    DECLARE v_order_position INT UNSIGNED;
    DECLARE v_previous_lesson_completed BOOLEAN DEFAULT FALSE;
    DECLARE v_lesson_xp INT UNSIGNED DEFAULT 50;

    SELECT l.learning_path_id, l.order_position, l.xp_reward
    INTO v_learning_path_id, v_order_position, v_lesson_xp
    FROM lessons l WHERE l.id = p_lesson_id;

    IF v_learning_path_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Leccion no encontrada';
        SET p_xp_earned = 0;
        SET p_new_level = 1;
    ELSEIF v_order_position > 1 THEN
        SELECT COUNT(*) > 0 INTO v_previous_lesson_completed
        FROM user_progress up
        JOIN lessons l ON up.lesson_id = l.id
        WHERE up.user_id = p_user_id
          AND l.learning_path_id = v_learning_path_id
          AND l.order_position = v_order_position - 1
          AND up.status = 'completed';

        IF NOT v_previous_lesson_completed THEN
            SET p_success = FALSE;
            SET p_message = 'Debes completar la leccion anterior primero';
            SET p_xp_earned = 0;
            SET p_new_level = 1;
        ELSE
            INSERT INTO user_progress (user_id, lesson_id, status, started_at, completed_at, last_accessed_at, xp_earned)
            VALUES (p_user_id, p_lesson_id, 'completed', NOW(), NOW(), NOW(), v_lesson_xp)
            ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW(), xp_earned = v_lesson_xp;

            INSERT INTO user_stats (user_id, total_xp, lessons_completed, current_level)
            VALUES (p_user_id, v_lesson_xp, 1, 1)
            ON DUPLICATE KEY UPDATE total_xp = total_xp + v_lesson_xp, lessons_completed = lessons_completed + 1, current_level = FLOOR((total_xp + v_lesson_xp) / 500) + 1;

            SELECT current_level INTO p_new_level FROM user_stats WHERE user_id = p_user_id;
            SET p_success = TRUE;
            SET p_message = 'Leccion completada exitosamente';
            SET p_xp_earned = v_lesson_xp;
        END IF;
    ELSE
        INSERT INTO user_progress (user_id, lesson_id, status, started_at, completed_at, last_accessed_at, xp_earned)
        VALUES (p_user_id, p_lesson_id, 'completed', NOW(), NOW(), NOW(), v_lesson_xp)
        ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW(), xp_earned = v_lesson_xp;

        INSERT INTO user_stats (user_id, total_xp, lessons_completed, current_level)
        VALUES (p_user_id, v_lesson_xp, 1, 1)
        ON DUPLICATE KEY UPDATE total_xp = total_xp + v_lesson_xp, lessons_completed = lessons_completed + 1, current_level = FLOOR((total_xp + v_lesson_xp) / 500) + 1;

        SELECT current_level INTO p_new_level FROM user_stats WHERE user_id = p_user_id;
        SET p_success = TRUE;
        SET p_message = 'Leccion completada exitosamente';
        SET p_xp_earned = v_lesson_xp;
    END IF;
END //

DELIMITER ;

-- ============================================================
-- EVENT: Limpieza automatica de tokens expirados
-- ============================================================
DELIMITER //

CREATE EVENT IF NOT EXISTS `cleanup_expired_tokens`
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM password_resets WHERE expires_at < NOW() OR used = TRUE;
    DELETE FROM email_verifications WHERE expires_at < NOW() OR verified = TRUE;
    DELETE FROM token_blacklist WHERE expires_at < NOW();
END //

DELIMITER ;

-- ============================================================
-- TRIGGER: Crear estadisticas tras registro
-- ============================================================
DELIMITER //

CREATE TRIGGER `trg_after_user_registration`
AFTER INSERT ON `users`
FOR EACH ROW
BEGIN
    INSERT INTO user_stats (user_id, total_xp, current_level, lessons_completed)
    VALUES (NEW.id, 0, 1, 0);
END //

DELIMITER ;

-- ============================================================
-- INDICES ADICIONALES
-- ============================================================
CREATE INDEX `idx_user_progress_status` ON `user_progress`(`user_id`, `status`);
CREATE INDEX `idx_lessons_path_published` ON `lessons`(`learning_path_id`, `is_published`);
CREATE INDEX `idx_submissions_user_status` ON `user_submissions`(`user_id`, `status`);
CREATE INDEX `idx_achievements_active` ON `achievements`(`is_active`, `requirement_type`);
CREATE INDEX `idx_notifications_unread` ON `notifications`(`user_id`, `is_read`);

-- ============================================================
-- VERIFICACION FINAL
-- ============================================================
SELECT
    TABLE_NAME AS 'Tabla',
    TABLE_ROWS AS 'Filas Estimadas',
    ENGINE AS 'Motor',
    TABLE_COLLATION AS 'Collation'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'codequest'
ORDER BY TABLE_NAME;

SELECT 'Programming Languages' AS 'Tipo', COUNT(*) AS 'Cantidad' FROM programming_languages
UNION ALL SELECT 'Learning Paths', COUNT(*) FROM learning_paths
UNION ALL SELECT 'Achievements', COUNT(*) FROM achievements
UNION ALL SELECT 'System Settings', COUNT(*) FROM system_settings;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
