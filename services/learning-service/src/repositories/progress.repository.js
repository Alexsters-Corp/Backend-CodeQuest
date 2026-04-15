class ProgressRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async getOverview(userId) {
    const [rows] = await this.pool.query(
      `SELECT
         COUNT(*) AS total_lessons,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons,
         COALESCE(SUM(xp_earned), 0) AS total_xp
       FROM user_progress
       WHERE user_id = ?`,
      [userId]
    )

    return rows[0] || { total_lessons: 0, completed_lessons: 0, total_xp: 0 }
  }

  // Marca la lección como completada en user_progress (solo estado, sin tocar user_stats)
  async markLessonCompleted({ userId, lessonId, xpReward }) {
    const normalizedXp = Number.isFinite(Number(xpReward)) ? Math.max(0, Number(xpReward)) : 0

    await this.pool.query(
      `INSERT INTO user_progress (user_id, lesson_id, status, xp_earned, started_at, completed_at, updated_at)
       VALUES (?, ?, 'completed', ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         status = 'completed',
         xp_earned = GREATEST(xp_earned, VALUES(xp_earned)),
         completed_at = NOW(),
         updated_at = NOW()`,
      [userId, lessonId, normalizedXp]
    )
  }

  async getProgressForLesson({ userId, lessonId }) {
    const [rows] = await this.pool.query(
      `SELECT status, xp_earned, submission_count
       FROM user_progress
       WHERE user_id = ? AND lesson_id = ?
       LIMIT 1`,
      [userId, lessonId]
    )

    return rows[0] || null
  }

  async upsertProgressIfBetter({ userId, lessonId, newXp, newStatus }) {
    const normalizedXp = Number.isFinite(Number(newXp)) ? Math.max(0, Number(newXp)) : 0

    await this.pool.query(
      `INSERT INTO user_progress
         (user_id, lesson_id, status, xp_earned, started_at, completed_at, last_accessed_at, submission_count, updated_at)
       VALUES (?, ?, ?, ?, NOW(), IF(? = 'completed', NOW(), NULL), NOW(), 1, NOW())
       ON DUPLICATE KEY UPDATE
         status           = IF(status = 'completed', 'completed', VALUES(status)),
         xp_earned        = GREATEST(xp_earned, VALUES(xp_earned)),
         completed_at     = IF(status != 'completed' AND VALUES(status) = 'completed', NOW(), completed_at),
         last_accessed_at = NOW(),
         submission_count = submission_count + 1,
         updated_at       = NOW()`,
      [userId, lessonId, newStatus, normalizedXp, newStatus]
    )
  }

  async getPathLessonStatsByLanguage({ userId, languageId }) {
    const [rows] = await this.pool.query(
      `SELECT lp.id AS path_id,
              COUNT(DISTINCT l.id) AS total_lessons,
              COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons
       FROM learning_paths lp
       LEFT JOIN lessons l ON l.learning_path_id = lp.id AND l.is_published = 1
       LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
       WHERE lp.programming_language_id = ?
         AND lp.is_active = 1
       GROUP BY lp.id`,
      [userId, languageId]
    )

    return rows
  }

  // Fuente de verdad del XP acumulado total (racha + total_xp)
  async getStreakOverview(userId) {
    const [rows] = await this.pool.query(
      `SELECT COALESCE(MAX(streak_current), 0) AS streak_current,
              COALESCE(MAX(streak_longest), 0) AS streak_longest,
              COALESCE(MAX(total_xp), 0) AS total_xp
       FROM user_stats
       WHERE user_id = ?`,
      [userId]
    )

    return rows[0] || { streak_current: 0, streak_longest: 0, total_xp: 0 }
  }

  async getLessonStatsByLanguage({ userId, languageId }) {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) AS started_lessons,
              COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons,
              COALESCE(SUM(up.xp_earned), 0) AS earned_xp
       FROM user_progress up
       JOIN lessons l ON l.id = up.lesson_id
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       WHERE up.user_id = ?
         AND lp.programming_language_id = ?`,
      [userId, languageId]
    )

    return rows[0] || { started_lessons: 0, completed_lessons: 0, earned_xp: 0 }
  }

  // Suma XP al acumulado total del usuario (user_stats.total_xp)
  async addXpToStats({ userId, xp }) {
    const normalizedXp = Math.max(0, Number(xp) || 0)
    if (normalizedXp === 0) return

    await this.pool.query(
      `INSERT INTO user_stats (user_id, total_xp, submissions_total)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE
         total_xp          = total_xp + ?,
         submissions_total = submissions_total + 1,
         updated_at        = NOW()`,
      [userId, normalizedXp, normalizedXp]
    )
  }

  async deleteProgressByLanguage({ userId, languageId }) {
    const [result] = await this.pool.query(
      `DELETE up
       FROM user_progress up
       JOIN lessons l ON l.id = up.lesson_id
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       WHERE up.user_id = ?
         AND lp.programming_language_id = ?`,
      [userId, languageId]
    )

    return Number(result.affectedRows || 0)
  }
}

module.exports = ProgressRepository
