USE codequest;

-- ============================================================
-- SEED: Usuarios por defecto para desarrollo
-- ============================================================
-- Password para todos los usuarios: 123456
-- Hash generado con bcryptjs (cost 10)
-- ============================================================

SET @pwd_hash = '$2b$10$2GudZpDd4Pi6HgRepv52bu2PUzSat4ucpCYYQwGlbEADfyJp0dMpO';

INSERT INTO `users` (`email`, `password_hash`, `name`, `username`, `role`, `email_verified`, `is_active`) VALUES
('admin@codequest.local', @pwd_hash, 'Administrador CodeQuest', 'admin', 'admin', TRUE, TRUE),
('instructor@codequest.local', @pwd_hash, 'Instructor CodeQuest', 'instructor', 'instructor', TRUE, TRUE),
('student@codequest.local', @pwd_hash, 'Estudiante CodeQuest', 'student', 'user', TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
    `password_hash` = VALUES(`password_hash`),
    `name` = VALUES(`name`),
    `role` = VALUES(`role`),
    `email_verified` = TRUE,
    `is_active` = TRUE;
