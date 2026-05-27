class PathsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async listActiveLanguages() {
    const [rows] = await this.pool.query(
      `SELECT pl.id,
              COALESCE(pl.display_name, pl.name) AS name,
              COALESCE(pl.logo_url, 'code') AS icon
       FROM programming_languages pl
       WHERE pl.is_active = 1
         AND EXISTS (
           SELECT 1
           FROM learning_paths lp
           WHERE lp.programming_language_id = pl.id
             AND lp.is_active = 1
         )
       ORDER BY COALESCE(pl.display_name, pl.name) ASC`
    )

    return rows
  }

  async findLanguageById(languageId) {
    const [rows] = await this.pool.query(
      `SELECT pl.id,
              COALESCE(pl.display_name, pl.name) AS name,
              COALESCE(pl.logo_url, 'code') AS icon
       FROM programming_languages pl
       WHERE pl.id = ?
         AND pl.is_active = 1
         AND EXISTS (
           SELECT 1
           FROM learning_paths lp
           WHERE lp.programming_language_id = pl.id
             AND lp.is_active = 1
         )
       LIMIT 1`,
      [languageId]
    )

    return rows[0] || null
  }

  async listPaths({ languageId, difficulty, locale = 'es' }) {
    const conditions = ['lp.is_active = 1']
    const params = []

    if (languageId) {
      conditions.push('lp.programming_language_id = ?')
      params.push(languageId)
    }

    if (difficulty) {
      conditions.push('lp.difficulty_level = ?')
      params.push(difficulty)
    }

    const [rows] = await this.pool.query(
      `SELECT lp.id,
              COALESCE(lpt.name, lp.name) AS name,
              COALESCE(lpt.description, lp.description, '') AS description,
              lp.difficulty_level,
              COALESCE(lp.is_optional, 0) AS is_optional,
              COALESCE(lp.order_position, 999) AS order_position,
              lp.programming_language_id,
              COALESCE(pl.display_name, pl.name) AS language_name,
              COALESCE(pl.logo_url, 'code') AS language_icon
       FROM learning_paths lp
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       LEFT JOIN learning_path_translations lpt
         ON lpt.learning_path_id = lp.id
        AND lpt.locale = ?
       WHERE ${conditions.join(' AND ')}
       ORDER BY lp.programming_language_id, COALESCE(lp.order_position, 999), lp.id`,
      [locale, ...params]
    )

    return rows
  }

  async findById(pathId, { locale = 'es' } = {}) {
    const [rows] = await this.pool.query(
      `SELECT lp.id,
              COALESCE(lpt.name, lp.name) AS name,
              COALESCE(lpt.description, lp.description, '') AS description,
              lp.difficulty_level,
              COALESCE(lp.is_optional, 0) AS is_optional,
              COALESCE(lp.order_position, 999) AS order_position,
              lp.programming_language_id,
              COALESCE(pl.display_name, pl.name) AS language_name,
              COALESCE(pl.logo_url, 'code') AS language_icon
       FROM learning_paths lp
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       LEFT JOIN learning_path_translations lpt
         ON lpt.learning_path_id = lp.id
        AND lpt.locale = ?
       WHERE lp.id = ? AND lp.is_active = 1
       LIMIT 1`,
      [locale, pathId]
    )

    return rows[0] || null
  }

  async getSelectedPathForUserLanguage({ userId, languageId }) {
    const [rows] = await this.pool.query(
      `SELECT ulp.learning_path_id
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       WHERE ulp.user_id = ?
         AND lp.programming_language_id = ?
       ORDER BY ulp.last_accessed_at DESC, ulp.id DESC
       LIMIT 1`,
      [userId, languageId]
    )

    return rows[0] ? Number(rows[0].learning_path_id) : null
  }

  async replaceSelectedPathForUserLanguage({ userId, languageId, pathId }) {
    await this.pool.query(
      `DELETE ulp
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       WHERE ulp.user_id = ?
         AND lp.programming_language_id = ?`,
      [userId, languageId]
    )

    await this.pool.query(
      `INSERT INTO user_learning_paths (
         user_id,
         learning_path_id,
         progress_percentage,
         selected_at,
         last_accessed_at
       )
       VALUES (?, ?, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         selected_at = NOW(),
         last_accessed_at = NOW()`,
      [userId, pathId]
    )
  }

  async listUserSelectedLanguages(userId) {
    const [rows] = await this.pool.query(
      `SELECT lp.programming_language_id AS language_id,
              COALESCE(pl.display_name, pl.name) AS language_name,
              COALESCE(pl.logo_url, 'code') AS language_icon,
              MIN(ulp.learning_path_id) AS selected_path_id
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       WHERE ulp.user_id = ?
       GROUP BY lp.programming_language_id, COALESCE(pl.display_name, pl.name), COALESCE(pl.logo_url, 'code')
       ORDER BY COALESCE(pl.display_name, pl.name) ASC`,
      [userId]
    )

    return rows
  }

  async deleteSelectedPathForUserLanguage({ userId, languageId }) {
    const [result] = await this.pool.query(
      `DELETE ulp
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       WHERE ulp.user_id = ?
         AND lp.programming_language_id = ?`,
      [userId, languageId]
    )

    return Number(result.affectedRows || 0)
  }
}

module.exports = PathsRepository
