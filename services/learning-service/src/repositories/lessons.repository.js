class LessonsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async listByPath({ pathId, userId }) {
    const [rows] = await this.pool.query(
      `SELECT l.id,
              l.learning_path_id,
              l.title,
              COALESCE(l.description, '') AS description,
              l.order_position,
              l.xp_reward,
              COALESCE(up.status, 'not_started') AS status,
              COALESCE(up.xp_earned, 0) AS xp_earned
       FROM lessons l
       LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
       WHERE l.learning_path_id = ?
         AND l.is_published = 1
       ORDER BY l.order_position ASC, l.id ASC`,
      [userId || 0, pathId]
    )

    return rows
  }

  async findById({ lessonId, userId }) {
    const [rows] = await this.pool.query(
      `SELECT l.id,
              l.learning_path_id,
              lp.programming_language_id,
              lp.name AS learning_path_name,
              l.title,
              COALESCE(l.description, '') AS description,
              COALESCE(l.content, '') AS content,
              l.order_position,
              l.xp_reward,
              COALESCE(up.status, 'not_started') AS status,
              COALESCE(up.xp_earned, 0) AS xp_earned
       FROM lessons l
       JOIN learning_paths lp ON lp.id = l.learning_path_id
       LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
       WHERE l.id = ?
         AND l.is_published = 1
       LIMIT 1`,
      [userId || 0, lessonId]
    )

    return rows[0] || null
  }
}

module.exports = LessonsRepository
