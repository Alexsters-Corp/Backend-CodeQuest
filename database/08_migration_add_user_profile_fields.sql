-- Persist additional user profile fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS country_code CHAR(2) NULL AFTER avatar_url,
  ADD COLUMN IF NOT EXISTS birth_date DATE NULL AFTER country_code;
