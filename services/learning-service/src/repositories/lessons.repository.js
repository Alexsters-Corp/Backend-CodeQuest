class LessonsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async listByPath({ pathId, userId, locale = 'es' }) {
    const [rows] = await this.pool.query(
      `SELECT l.id,
              l.learning_path_id,
              COALESCE(lt.title, l.title) AS title,
              COALESCE(lt.description, l.description, '') AS description,
              l.order_position,
              l.xp_reward,
              COALESCE(l.is_ai_assisted, 0) AS is_ai_assisted,
              COALESCE(up.status, 'not_started') AS status,
              COALESCE(up.xp_earned, 0) AS xp_earned
       FROM lessons l
       LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
       LEFT JOIN lesson_translations lt
         ON lt.lesson_id = l.id
        AND lt.locale = ?
       WHERE l.learning_path_id = ?
         AND l.is_published = 1
       ORDER BY l.order_position ASC, l.id ASC`,
      [userId || 0, locale, pathId]
    )

    return rows
  }

  async findById({ lessonId, userId, locale = 'es' }) {
    const [rows] = await this.pool.query(
      `SELECT l.id,
              l.learning_path_id,
              lp.programming_language_id,
              COALESCE(lpt.name, lp.name) AS learning_path_name,
              COALESCE(lt.title, l.title) AS title,
              COALESCE(lt.description, l.description, '') AS description,
              COALESCE(lt.content, l.content, '') AS content,
              l.order_position,
              l.xp_reward,
              COALESCE(l.is_ai_assisted, 0) AS is_ai_assisted,
              COALESCE(up.status, 'not_started') AS status,
              COALESCE(up.xp_earned, 0) AS xp_earned
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
       LEFT JOIN lesson_translations lt
         ON lt.lesson_id = l.id
        AND lt.locale = ?
       LEFT JOIN learning_path_translations lpt
         ON lpt.learning_path_id = lp.id
        AND lpt.locale = ?
       WHERE l.id = ?
         AND l.is_published = 1
       LIMIT 1`,
      [userId || 0, locale, locale, lessonId]
    )

    return rows[0] || null
  }

  async listCompleted(userId) {
    const [rows] = await this.pool.query(
      `SELECT l.id,
              l.learning_path_id,
              lp.name AS learning_path_name,
              l.title,
              COALESCE(l.description, '') AS description,
              l.order_position,
              l.xp_reward,
              COALESCE(l.is_ai_assisted, 0) AS is_ai_assisted,
              up.xp_earned,
              up.completed_at
       FROM user_progress up
       JOIN lessons l ON l.id = up.lesson_id
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       WHERE up.user_id = ?
         AND up.status = 'completed'
         AND l.is_published = 1
       ORDER BY up.completed_at DESC`,
      [userId]
    )

    return rows
  }
}

module.exports = LessonsRepository
