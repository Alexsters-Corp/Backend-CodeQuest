-- ============================================================
-- MIGRATION 10: Security fixes
-- - Add tokens_valid_after to users (invalidate sessions on password reset)
-- - Fix cleanup event to include auth_tokens
-- ============================================================

USE `codequest`;

-- Add tokens_valid_after column for session invalidation after password reset
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `tokens_valid_after` DATETIME NULL DEFAULT NULL
  COMMENT 'All JWTs issued before this timestamp are considered invalid';

-- Drop and recreate the cleanup event to include auth_tokens
DROP EVENT IF EXISTS `cleanup_expired_tokens`;

DELIMITER //

CREATE EVENT `cleanup_expired_tokens`
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- Clean up expired/used auth tokens (password reset, email verification)
    DELETE FROM auth_tokens
    WHERE expires_at < NOW() OR used_at IS NOT NULL;

    -- Clean up expired blacklisted tokens
    DELETE FROM token_blacklist WHERE expires_at < NOW();
END //

DELIMITER ;

-- Enable event scheduler if not already on (idempotent hint for DBAs)
-- SET GLOBAL event_scheduler = ON;
