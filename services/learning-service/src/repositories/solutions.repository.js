class SolutionsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  /**
   * Devuelve la solución registrada en BD para una lección específica.
   * Retorna null si no existe registro (permite fallback al objeto hardcodeado).
   */
  async findByLesson(lessonId) {
    const [rows] = await this.pool.query(
      `SELECT lesson_id, language_id, solution_code, explanation, prompt, base_code
       FROM lesson_solutions
       WHERE lesson_id = ?
       LIMIT 1`,
      [lessonId]
    )

    return rows[0] || null
  }
}

module.exports = SolutionsRepository
