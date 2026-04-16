class SubmissionsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async createSubmission({ userId, lessonId, languageId, codeSubmitted, status, testCasesPassed, testCasesTotal, pointsEarned }) {
    const [result] = await this.pool.query(
      `INSERT INTO user_submissions
         (user_id, lesson_id, language_id, code_submitted, status, test_cases_passed, test_cases_total, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, lessonId, languageId, codeSubmitted, status, testCasesPassed, testCasesTotal, pointsEarned]
    )

    return Number(result.insertId)
  }

  async getBestSubmission({ userId, lessonId }) {
    const [rows] = await this.pool.query(
      `SELECT id, status, test_cases_passed, test_cases_total, points_earned, created_at
       FROM user_submissions
       WHERE user_id = ? AND lesson_id = ? AND status = 'accepted'
       ORDER BY points_earned DESC, created_at ASC
       LIMIT 1`,
      [userId, lessonId]
    )

    return rows[0] || null
  }

  async countAttemptsByLesson({ userId, lessonId }) {
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) AS total FROM user_submissions
       WHERE user_id = ? AND lesson_id = ?`,
      [userId, lessonId]
    )

    return Number(rows[0]?.total || 0)
  }
}

module.exports = SubmissionsRepository
