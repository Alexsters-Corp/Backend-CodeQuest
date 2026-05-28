const { AppError, asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { pool, learningService } = require('../services/container')

function getRequestLocale(req) {
  return String(req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'es'
}

function normalizeLanguageSlug(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized || null
}

/**
 * Devuelve la primera leccion publicada disponible para el lenguaje solicitado.
 * Si existe una marcada como is_free_demo, tiene prioridad. Si no, cae en la
 * primera leccion publicada de ese lenguaje para que el selector del demo
 * realmente cambie el contenido por tecnologia.
 */
async function resolveDemoLessonId(languageSlug = null) {
  const params = []
  const languageFilter = languageSlug ? 'AND pl.slug = ?' : ''

  if (languageSlug) {
    params.push(languageSlug)
  }

  const [rows] = await pool.query(
    `SELECT l.id
     FROM lessons l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     JOIN programming_languages pl ON pl.id = lp.programming_language_id
     WHERE l.is_published = 1
       AND pl.is_active = 1
       ${languageFilter}
     ORDER BY CASE WHEN l.is_free_demo = 1 THEN 0 ELSE 1 END,
              COALESCE(lp.order_position, 999),
              COALESCE(l.order_position, 999),
              l.id ASC
     LIMIT 1`,
    params
  )

  const row = rows[0]
  if (!row) {
    throw AppError.notFound('No hay leccion demo configurada.', 'DEMO_LESSON_NOT_AVAILABLE')
  }

  return Number(row.id)
}

/**
 * Verifica que la leccion solicitada este publicada y pertenezca a un lenguaje
 * activo, para que pueda usarse en el recorrido publico del demo.
 */
async function assertLessonAccessibleInDemo(lessonId) {
  const [rows] = await pool.query(
    `SELECT l.id
     FROM lessons l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     JOIN programming_languages pl ON pl.id = lp.programming_language_id
     WHERE l.id = ?
       AND l.is_published = 1
       AND pl.is_active = 1
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
 * Devuelve la leccion demo con sus ejercicios.
 * Sin auth. No persiste nada en BD.
 */
const getDemoLesson = asyncHandler(async (req, res) => {
  const locale = getRequestLocale(req)
  const languageSlug = normalizeLanguageSlug(req.query?.language)
  const lessonId = await resolveDemoLessonId(languageSlug)

  const payload = await learningService.getLessonSession({
    lessonId,
    userId: 0,
    locale,
  })

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

  await assertLessonAccessibleInDemo(lessonId)

  const result = await learningService.submitLessonExercise({
    userId: 0,
    lessonId,
    exerciseId,
    answer: req.body?.answer,
    locale: getRequestLocale(req),
  })

  return res.status(200).json(result)
})

/**
 * GET /api/learning/demo/preview
 * Devuelve metricas del catalogo y una previsualizacion localizada de las
 * siguientes lecciones del lenguaje elegido.
 */
const getDemoPreview = asyncHandler(async (req, res) => {
  const locale = getRequestLocale(req)
  const languageSlug = normalizeLanguageSlug(req.query?.language)

  const lessonCountParams = []
  const lessonCountJoins = languageSlug
    ? `JOIN learning_paths lp ON lp.id = l.learning_path_id
       JOIN programming_languages pl ON pl.id = lp.programming_language_id`
    : ''
  const lessonCountFilter = languageSlug ? 'AND pl.slug = ?' : ''

  if (languageSlug) {
    lessonCountParams.push(languageSlug)
  }

  const [[lessonsCountRow]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM lessons l
     ${lessonCountJoins}
     WHERE l.is_published = 1
       ${lessonCountFilter}`,
    lessonCountParams
  )

  const [languagesRows] = await pool.query(
    `SELECT id, name, slug, display_name
     FROM programming_languages
     WHERE is_active = 1
     ORDER BY id ASC`
  )

  const nextLessonsParams = [locale]
  const nextLessonsFilter = languageSlug ? 'AND pl.slug = ?' : ''
  if (languageSlug) {
    nextLessonsParams.push(languageSlug)
  }

  const [nextLessonsRows] = await pool.query(
    `SELECT COALESCE(lt.title, l.title) AS title
     FROM lessons l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     JOIN programming_languages pl ON pl.id = lp.programming_language_id
     LEFT JOIN lesson_translations lt
       ON lt.lesson_id = l.id
      AND lt.locale = ?
     WHERE l.is_published = 1
       AND l.is_free_demo = 0
       ${nextLessonsFilter}
     ORDER BY l.id ASC
     LIMIT 3`,
    nextLessonsParams
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
