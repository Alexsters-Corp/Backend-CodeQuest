class SolutionsRepository {
  constructor({ pool }) {
    this.pool = pool
  }

  /**
   * Devuelve la solución registrada en BD para una lección específica.
   * Retorna null si no existe registro.
   */
  async findByLesson(lessonId, { locale = 'es' } = {}) {
    const [rows] = await this.pool.query(
      `SELECT ls.lesson_id,
              ls.language_id,
              ls.solution_code,
              COALESCE(lst.explanation, ls.explanation) AS explanation,
              COALESCE(lst.prompt, ls.prompt) AS prompt,
              ls.base_code
       FROM lesson_solutions ls
       LEFT JOIN lesson_solution_translations lst
         ON lst.lesson_solution_id = ls.id
        AND lst.locale = ?
       WHERE ls.lesson_id = ?
       LIMIT 1`,
      [locale, lessonId]
    )

    return rows[0] || null
  }

  /**
   * Devuelve la solución oficial de una lección para mostrarla al usuario.
   * Incluye el código resuelto (base_code con _____ reemplazado por solution_code).
   */
  async getSolutionForUser(lessonId, { locale = 'es' } = {}) {
    const [rows] = await this.pool.query(
      `SELECT ls.lesson_id,
              ls.solution_code,
              COALESCE(lst.explanation, ls.explanation) AS explanation,
              ls.base_code,
              COALESCE(lt.title, l.title) AS lesson_title
       FROM lesson_solutions ls
       JOIN lessons l ON l.id = ls.lesson_id
       LEFT JOIN lesson_solution_translations lst
         ON lst.lesson_solution_id = ls.id
        AND lst.locale = ?
       LEFT JOIN lesson_translations lt
         ON lt.lesson_id = l.id
        AND lt.locale = ?
       WHERE ls.lesson_id = ?
         AND l.is_published = 1
       LIMIT 1`,
      [locale, locale, lessonId]
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
