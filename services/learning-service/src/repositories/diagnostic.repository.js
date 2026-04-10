class DiagnosticRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async getLatestAttemptByLanguage({ userId, languageId }) {
    const [rows] = await this.pool.query(
      `SELECT id,
              user_id,
              programming_language_id,
              status,
              total_questions,
              correct_answers,
              weighted_score,
              score_percentage,
              assigned_level,
              assigned_path_id,
              answers_json,
              started_at,
              completed_at
       FROM user_diagnostic_attempts
       WHERE user_id = ? AND programming_language_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [userId, languageId]
    )

    return rows[0] || null
  }

  async getAttemptById({ attemptId, userId }) {
    const [rows] = await this.pool.query(
      `SELECT id,
              user_id,
              programming_language_id,
              status,
              total_questions,
              correct_answers,
              weighted_score,
              score_percentage,
              assigned_level,
              assigned_path_id,
              answers_json,
              started_at,
              completed_at
       FROM user_diagnostic_attempts
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [attemptId, userId]
    )

    return rows[0] || null
  }

  async createAttempt({ userId, languageId, totalQuestions }) {
    const [result] = await this.pool.query(
      `INSERT INTO user_diagnostic_attempts (
         user_id,
         programming_language_id,
         status,
         total_questions,
         started_at,
         created_at,
         updated_at
       )
       VALUES (?, ?, 'in_progress', ?, NOW(), NOW(), NOW())`,
      [userId, languageId, totalQuestions]
    )

    return result.insertId
  }

  async completeAttempt({
    attemptId,
    userId,
    correctAnswers,
    weightedScore,
    scorePercentage,
    assignedLevel,
    assignedPathId,
    answersJson,
  }) {
    await this.pool.query(
      `UPDATE user_diagnostic_attempts
       SET status = 'completed',
           correct_answers = ?,
           weighted_score = ?,
           score_percentage = ?,
           assigned_level = ?,
           assigned_path_id = ?,
           answers_json = ?,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        correctAnswers,
        weightedScore,
        scorePercentage,
        assignedLevel,
        assignedPathId,
        answersJson,
        attemptId,
        userId,
      ]
    )
  }

  async abandonInProgressAttempts({ userId, languageId }) {
    await this.pool.query(
      `UPDATE user_diagnostic_attempts
       SET status = 'abandoned',
           updated_at = NOW()
       WHERE user_id = ?
         AND programming_language_id = ?
         AND status = 'in_progress'`,
      [userId, languageId]
    )
  }

  async listLatestAttemptsByUser(userId) {
    const [rows] = await this.pool.query(
      `SELECT uda.id,
              uda.programming_language_id,
              uda.status,
              uda.correct_answers,
              uda.total_questions,
              uda.score_percentage,
              uda.assigned_level,
              uda.assigned_path_id,
              uda.completed_at,
              COALESCE(pl.display_name, pl.name) AS language_name,
              COALESCE(pl.logo_url, 'code') AS language_icon
       FROM user_diagnostic_attempts uda
       JOIN (
         SELECT programming_language_id, MAX(id) AS latest_id
         FROM user_diagnostic_attempts
         WHERE user_id = ?
         GROUP BY programming_language_id
       ) latest ON latest.latest_id = uda.id
       JOIN programming_languages pl ON pl.id = uda.programming_language_id
       WHERE uda.user_id = ?
       ORDER BY uda.id DESC`,
      [userId, userId]
    )

    return rows
  }

  async countAttemptsByLanguage({ userId, languageId }) {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) AS total
       FROM user_diagnostic_attempts
       WHERE user_id = ?
         AND programming_language_id = ?`,
      [userId, languageId]
    )

    return Number(rows[0]?.total || 0)
  }

  async deleteAttemptsByLanguage({ userId, languageId }) {
    const [result] = await this.pool.query(
      `DELETE FROM user_diagnostic_attempts
       WHERE user_id = ?
         AND programming_language_id = ?`,
      [userId, languageId]
    )

    return Number(result.affectedRows || 0)
  }
}

module.exports = DiagnosticRepository
