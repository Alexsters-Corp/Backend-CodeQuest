-- Recalcula current_level en user_stats basado en total_xp real
-- Fix para el bug donde addXpToStats() no actualizaba current_level

UPDATE user_stats
SET current_level = FLOOR(total_xp / 500) + 1,
    updated_at    = NOW()
WHERE current_level != FLOOR(total_xp / 500) + 1;
