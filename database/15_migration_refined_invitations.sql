USE codequest;

-- 15) Refinamiento de sistema de invitaciones
-- Agregamosjoined_via_code_id para auditoría
ALTER TABLE `class_students`
  ADD COLUMN `joined_via_code_id` BIGINT UNSIGNED NULL AFTER `joined_at`,
  ADD FOREIGN KEY (`joined_via_code_id`) REFERENCES `class_invite_codes`(`id`) ON DELETE SET NULL;

-- Aseguramos que los nombres de las columnas en class_invite_codes sean consistentes con la solicitud si fuera necesario,
-- pero los actuales ya son funcionales y claros.

-- Creamos una tabla de auditoría simple para eventos de clase
CREATE TABLE IF NOT EXISTS `class_audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `actor_user_id` INT UNSIGNED NOT NULL,
  `event_type` VARCHAR(50) NOT NULL, -- 'code_created', 'code_revoked', 'student_joined', 'class_edited'
  `details` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_class_event` (`class_id`, `event_type`),
  FOREIGN KEY (`class_id`) REFERENCES `instructor_classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
