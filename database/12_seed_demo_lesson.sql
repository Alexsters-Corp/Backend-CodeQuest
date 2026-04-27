-- ============================================================
-- MIGRATION 12: Marcar leccion demo publica (HU-025)
-- - Marca la leccion 1 (Introduccion a Python) como is_free_demo
--   para que el endpoint publico /api/learning/demo la exponga
--   sin autenticacion. Idempotente.
-- ============================================================

USE `codequest`;

UPDATE `lessons`
SET `is_free_demo` = 1
WHERE `id` = 1
  AND `is_published` = 1;
