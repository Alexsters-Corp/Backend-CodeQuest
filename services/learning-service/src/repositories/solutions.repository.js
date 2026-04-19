class SolutionsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  /**
   * Devuelve la solución registrada en BD para una lección específica.
   * Retorna null si no existe registro.
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

  /**
   * Devuelve la solución oficial de una lección para mostrarla al usuario.
   * Incluye el código resuelto (base_code con _____ reemplazado por solution_code).
   */
  async getSolutionForUser(lessonId) {
    const [rows] = await this.pool.query(
      `SELECT ls.lesson_id,
              ls.solution_code,
              ls.explanation,
              ls.base_code,
              l.title AS lesson_title
       FROM lesson_solutions ls
       JOIN lessons l ON l.id = ls.lesson_id
       WHERE ls.lesson_id = ?
         AND l.is_published = 1
       LIMIT 1`,
      [lessonId]
    )

    if (!rows[0]) return null

    const row = rows[0]

    return {
      lesson_id:    Number(row.lesson_id),
      lesson_title: row.lesson_title,
      solution_code: row.solution_code,
      explanation:  row.explanation,
      base_code:    row.base_code,
      solved_code:  (row.base_code || '').replace('_____', row.solution_code),
    }
  }
}

module.exports = SolutionsRepository
