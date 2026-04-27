const { AppError, asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { pool, learningService } = require('../services/container')

/**
 * Devuelve el id de la primera leccion publicada marcada como is_free_demo.
 * Si no hay ninguna, lanza 404.
 */
async function resolveDemoLessonId() {
  const [rows] = await pool.query(
    `SELECT id
     FROM lessons
     WHERE is_free_demo = 1
       AND is_published = 1
     ORDER BY id ASC
     LIMIT 1`
  )

  const row = rows[0]
  if (!row) {
    throw AppError.notFound('No hay leccion demo configurada.', 'DEMO_LESSON_NOT_AVAILABLE')
  }

  return Number(row.id)
}

/**
 * Verifica que la leccion solicitada sea demo. Aplica RN07 (solo lecciones marcadas).
 */
async function assertLessonIsDemo(lessonId) {
  const [rows] = await pool.query(
    `SELECT id
     FROM lessons
     WHERE id = ?
       AND is_free_demo = 1
       AND is_published = 1
     LIMIT 1`,
    [lessonId]
  )

  if (!rows[0]) {
    throw AppError.forbidden(
      'Esta leccion no esta disponible en modo demo. Registrate para acceder al contenido completo.',
      'DEMO_LESSON_NOT_AVAILABLE'
    )
  }
}

/**
 * GET /api/learning/demo/lesson
 * Devuelve la leccion demo (la primera marcada como is_free_demo) con sus ejercicios.
 * Sin auth. No persiste nada en BD.
 */
const getDemoLesson = asyncHandler(async (_req, res) => {
  const lessonId = await resolveDemoLessonId()

  // Reutilizamos la logica existente. userId = 0 hace que el LEFT JOIN
  // con user_progress no devuelva nada, por lo que status sera 'not_started'.
  const payload = await learningService.getLessonSession({ lessonId, userId: 0 })

  return res.status(200).json({
    ...payload,
    demo: true,
    lessonId,
  })
})

/**
 * POST /api/learning/demo/lessons/:lessonId/exercises/:exerciseId/submit
 * Valida la respuesta a un ejercicio de la leccion demo. No persiste progreso.
 */
const submitDemoExercise = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')
  const exerciseId = String(req.params.exerciseId || '').trim()

  await assertLessonIsDemo(lessonId)

  const result = await learningService.submitLessonExercise({
    userId: 0,
    lessonId,
    exerciseId,
    answer: req.body?.answer,
  })

  return res.status(200).json(result)
})

/**
 * GET /api/learning/demo/preview
 * Devuelve metricas del catalogo para mostrar en la pantalla de completion
 * (lo que el usuario "desbloqueara" al registrarse).
 */
const getDemoPreview = asyncHandler(async (_req, res) => {
  const [[lessonsCountRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM lessons WHERE is_published = 1`
  )

  const [languagesRows] = await pool.query(
    `SELECT id, name, slug, display_name
     FROM programming_languages
     WHERE is_active = 1
     ORDER BY id ASC`
  )

  const [nextLessonsRows] = await pool.query(
    `SELECT title
     FROM lessons
     WHERE is_published = 1
       AND is_free_demo = 0
     ORDER BY id ASC
     LIMIT 3`
  )

  return res.status(200).json({
    totalLessons: Number(lessonsCountRow?.total || 0),
    totalLanguages: languagesRows.length,
    languages: languagesRows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      displayName: row.display_name,
    })),
    nextLessonsTitles: nextLessonsRows.map((row) => row.title),
  })
})

module.exports = {
  getDemoLesson,
  submitDemoExercise,
  getDemoPreview,
}
