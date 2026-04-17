class FavoritesRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async listPathFavorites(userId) {
    const [rows] = await this.pool.query(
      `SELECT fp.learning_path_id,
              fp.created_at,
              lp.name,
              COALESCE(lp.description, '') AS description,
              lp.difficulty_level,
              lp.programming_language_id
       FROM user_favorite_paths fp
       JOIN learning_paths lp ON lp.id = fp.learning_path_id
       WHERE fp.user_id = ?
       ORDER BY fp.created_at DESC`,
      [userId]
    )

    return rows
  }

  async togglePathFavorite({ userId, pathId }) {
    const [existing] = await this.pool.query(
      `SELECT user_id
       FROM user_favorite_paths
       WHERE user_id = ? AND learning_path_id = ?
       LIMIT 1`,
      [userId, pathId]
    )

    if (existing.length > 0) {
      await this.pool.query(
        `DELETE FROM user_favorite_paths
         WHERE user_id = ? AND learning_path_id = ?`,
        [userId, pathId]
      )

      return false
    }

    await this.pool.query(
      `INSERT INTO user_favorite_paths (user_id, learning_path_id, created_at)
       VALUES (?, ?, NOW())`,
      [userId, pathId]
    )

    return true
  }

  async deletePathFavoritesByLanguage({ userId, languageId }) {
    const [result] = await this.pool.query(
      `DELETE fp
       FROM user_favorite_paths fp
       JOIN learning_paths lp ON lp.id = fp.learning_path_id
       WHERE fp.user_id = ?
         AND lp.programming_language_id = ?`,
      [userId, languageId]
    )

    return Number(result.affectedRows || 0)
  }

  async listLessonFavorites(userId) {
    const [rows] = await this.pool.query(
      `SELECT uf.lesson_id,
              uf.created_at,
              l.title,
              COALESCE(l.description, '') AS description,
              l.xp_reward,
              l.order_position,
              l.learning_path_id
       FROM user_favorites uf
       JOIN lessons l ON l.id = uf.lesson_id
       WHERE uf.user_id = ?
         AND l.is_published = 1
       ORDER BY uf.created_at DESC`,
      [userId]
    )

    return rows
  }

  async toggleLessonFavorite({ userId, lessonId }) {
    const [existing] = await this.pool.query(
      `SELECT user_id
       FROM user_favorites
       WHERE user_id = ? AND lesson_id = ?
       LIMIT 1`,
      [userId, lessonId]
    )

    if (existing.length > 0) {
      await this.pool.query(
        `DELETE FROM user_favorites
         WHERE user_id = ? AND lesson_id = ?`,
        [userId, lessonId]
      )

      return false
    }

    await this.pool.query(
      `INSERT INTO user_favorites (user_id, lesson_id, created_at)
       VALUES (?, ?, NOW())`,
      [userId, lessonId]
    )

    return true
  }
}

module.exports = FavoritesRepository
