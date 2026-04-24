-- ============================================================
-- MIGRATION 11: Social follows and ranking support
-- - Add user_follows for unidirectional social graph
-- ============================================================

USE `codequest`;

CREATE TABLE IF NOT EXISTS `user_follows` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `follower_id` INT UNSIGNED NOT NULL,
  `following_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_follows_pair` (`follower_id`, `following_id`),
  KEY `idx_user_follows_follower` (`follower_id`),
  KEY `idx_user_follows_following` (`following_id`),
  CONSTRAINT `fk_user_follows_follower`
    FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_follows_following`
    FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_user_follows_not_self`
    CHECK (`follower_id` <> `following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;