class SubmissionsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  async createSubmission({ userId, lessonId, languageId, codeSubmitted, status, testCasesPassed, testCasesTotal, pointsEarned }) {
    const [result] = await this.pool.query(
      `INSERT INTO user_submissions
         (user_id, lesson_id, language_id, code_submitted, status, test_cases_passed, test_cases_total, points_earned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, lessonId, languageId, codeSubmitted, status, testCasesPassed, testCasesTotal, pointsEarned]
    )

    return Number(result.insertId)
  }

  async getBestSubmission({ userId, lessonId }) {
    const [rows] = await this.pool.query(
      `SELECT id, status, test_cases_passed, test_cases_total, points_earned
       FROM user_submissions
       WHERE user_id = ? AND lesson_id = ?
       ORDER BY points_earned DESC, test_cases_passed DESC, created_at DESC
       LIMIT 1`,
      [userId, lessonId]
    )

    return rows[0] || null
  }

  async getSubmissionsByLesson({ userId, lessonId }) {
    const [rows] = await this.pool.query(
      `SELECT id, status, test_cases_passed, test_cases_total, points_earned, created_at
       FROM user_submissions
       WHERE user_id = ? AND lesson_id = ?
       ORDER BY created_at DESC`,
      [userId, lessonId]
    )

    return rows
  }
}

module.exports = SubmissionsRepository
