const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')
const LessonProgressService = require('../services/lessonProgress.service')

const lessonProgressService = new LessonProgressService({ pool })
const DEFAULT_LESSON_XP = 50
const SYNTHETIC_EXERCISE_OFFSET = 900000000

const DIFFICULTY_ORDER_SQL =
  "CASE lp.difficulty_level WHEN 'principiante' THEN 1 WHEN 'intermedio' THEN 2 ELSE 3 END"

async function ensureUserStatsRows(userId) {
  await pool.query(
    `INSERT IGNORE INTO user_stats (
       user_id,
       total_xp,
       current_level,
       lessons_completed,
       submissions_total,
       submissions_accepted,
       streak_current,
       streak_longest,
       last_activity_date
     )
     VALUES (?, 0, 1, 0, 0, 0, 0, 0, NULL)`,
    [userId]
  )
}

function mapPathState({ pathIndex, selectedIndex, totalLessons, completedLessons }) {
  if (pathIndex < selectedIndex) {
    return { estado: 'completado', porcentaje: 100 }
  }

  if (totalLessons > 0 && completedLessons >= totalLessons) {
    return { estado: 'completado', porcentaje: 100 }
  }

  if (pathIndex === selectedIndex) {
    const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    return { estado: 'en_progreso', porcentaje: percent }
  }

  return { estado: 'bloqueado', porcentaje: 0 }
}

async function resolvePathModules({ userId, languageId }) {
  const [paths] = await pool.query(
    `SELECT lp.id,
            lp.name AS nombre,
            COALESCE(lp.description, '') AS descripcion,
            lp.difficulty_level,
            COALESCE(pl.logo_url, 'code') AS icono,
            ${DIFFICULTY_ORDER_SQL} AS orden
     FROM learning_paths lp
     JOIN programming_languages pl ON pl.id = lp.programming_language_id
     WHERE lp.programming_language_id = ? AND lp.is_active = 1
     ORDER BY orden, lp.id`,
    [languageId]
  )

  if (paths.length === 0) {
    return []
  }

  const pathIds = paths.map((path) => path.id)

  const [progressRows] = await pool.query(
    `SELECT l.learning_path_id,
            COUNT(*) AS total_lessons,
            COALESCE(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_lessons
     FROM lessons l
     LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
     WHERE l.learning_path_id IN (?) AND l.is_published = 1
     GROUP BY l.learning_path_id`,
    [userId, pathIds]
  )

  const progressByPath = new Map(
    progressRows.map((row) => [
      Number(row.learning_path_id),
      {
        totalLessons: Number(row.total_lessons || 0),
        completedLessons: Number(row.completed_lessons || 0),
      },
    ])
  )

  const [selectedRows] = await pool.query(
    `SELECT ulp.learning_path_id
     FROM user_learning_paths ulp
     JOIN learning_paths lp ON lp.id = ulp.learning_path_id
     WHERE ulp.user_id = ? AND lp.programming_language_id = ?
     ORDER BY ulp.selected_at DESC, ulp.id DESC
     LIMIT 1`,
    [userId, languageId]
  )

  let selectedPathId = Number(selectedRows[0]?.learning_path_id || 0)
  const hasSelectedPathInLanguage = paths.some((path) => Number(path.id) === selectedPathId)

  if (!hasSelectedPathInLanguage) {
    selectedPathId = Number(paths[0].id)

    await pool.query(
      `DELETE ulp
       FROM user_learning_paths ulp
       JOIN learning_paths lp ON lp.id = ulp.learning_path_id
       WHERE ulp.user_id = ?
         AND lp.programming_language_id = ?
         AND ulp.learning_path_id <> ?`,
      [userId, languageId, selectedPathId]
    )

    await pool.query(
      `INSERT INTO user_learning_paths (user_id, learning_path_id, progress_percentage, selected_at, last_accessed_at)
       VALUES (?, ?, 0.00, NOW(), NOW())
       ON DUPLICATE KEY UPDATE learning_path_id = VALUES(learning_path_id),
                               progress_percentage = VALUES(progress_percentage),
                               selected_at = NOW(),
                               last_accessed_at = NOW()`,
      [userId, selectedPathId]
    )
  }

  const selectedIndex = Math.max(
    0,
    paths.findIndex((path) => Number(path.id) === selectedPathId)
  )

  return paths.map((path, index) => {
    const stats = progressByPath.get(Number(path.id)) || { totalLessons: 0, completedLessons: 0 }
    const state = mapPathState({
      pathIndex: index,
      selectedIndex,
      totalLessons: stats.totalLessons,
      completedLessons: stats.completedLessons,
    })

    return {
      id: Number(path.id),
      nombre: path.nombre,
      descripcion: path.descripcion,
      numero: index + 1,
      icono: path.icono,
      xp_recompensa: DEFAULT_LESSON_XP,
      estado: state.estado,
      porcentaje: state.porcentaje,
      totalLessons: stats.totalLessons,
      completedLessons: stats.completedLessons,
      difficulty: path.difficulty_level,
    }
  })
}

/**
 * GET /api/lessons/modules?languageId=1
 * Lista módulos de un lenguaje con su progreso para el usuario.
 */
const getModules = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.query.languageId, 'languageId')
  const userId = req.user.id

  await ensureUserStatsRows(userId)
  const modules = await resolvePathModules({ userId, languageId })

  return res.status(200).json(
    modules.map(({ totalLessons, completedLessons, difficulty, ...publicModule }) => publicModule)
  )
})

/**
 * GET /api/lessons/module/:moduleId
 * Lista lecciones de un módulo con su progreso.
 */
const getLessons = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveInt(req.params.moduleId, 'moduleId')
  const userId = req.user.id

  const [pathRows] = await pool.query(
    `SELECT id, programming_language_id
     FROM learning_paths
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [moduleId]
  )

  if (pathRows.length === 0) {
    throw AppError.notFound('Modulo no encontrado.')
  }

  const modules = await resolvePathModules({
    userId,
    languageId: Number(pathRows[0].programming_language_id),
  })
  const moduleState = modules.find((module) => Number(module.id) === moduleId)

  if (!moduleState) {
    throw AppError.notFound('Modulo no encontrado.')
  }

  if (moduleState.estado === 'bloqueado') {
    throw AppError.forbidden('Este módulo está bloqueado.')
  }

  const [lessons] = await pool.query(
    `SELECT l.id,
            l.title,
            COALESCE(l.description, '') AS description,
            l.order_position,
            COALESCE(up.status, 'not_started') AS progress_status,
            COALESCE(up.xp_earned, 0) AS xp_earned
     FROM lessons l
     LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
     WHERE l.learning_path_id = ? AND l.is_published = 1
     ORDER BY l.order_position`,
    [userId, moduleId]
  )

  let unlockNext = true
  const responseLessons = lessons.map((lesson) => {
    let estado = 'bloqueado'

    if (lesson.progress_status === 'completed') {
      estado = 'completada'
    } else if (unlockNext) {
      estado = lesson.progress_status === 'in_progress' ? 'en_progreso' : 'disponible'
      unlockNext = false
    }

    if (lesson.progress_status === 'completed') {
      unlockNext = true
    }

    return {
      id: Number(lesson.id),
      titulo: lesson.title,
      descripcion: lesson.description,
      numero: Number(lesson.order_position),
      tipo: 'teoria_practica',
      xp_recompensa: DEFAULT_LESSON_XP,
      estado,
      puntuacion_mejor: Number(lesson.xp_earned || 0),
    }
  })

  return res.status(200).json(responseLessons)
})

/**
 * GET /api/lessons/:lessonId
 * Obtiene el contenido de una lección: teoría + ejercicios.
 */
const getLessonContent = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')
  const userId = req.user.id

  const [lessons] = await pool.query(
    `SELECT l.id,
            l.learning_path_id,
            l.title,
            COALESCE(l.description, '') AS description,
            l.content,
            l.order_position,
            lp.name AS modulo_nombre,
            lp.programming_language_id AS lenguaje_id
     FROM lessons l
     JOIN learning_paths lp ON lp.id = l.learning_path_id
     WHERE l.id = ? AND l.is_published = 1`,
    [lessonId]
  )

  if (lessons.length === 0) {
    throw AppError.notFound('Lección no encontrada.')
  }

  const lesson = lessons[0]

  const modules = await resolvePathModules({
    userId,
    languageId: Number(lesson.lenguaje_id),
  })
  const moduleState = modules.find((module) => Number(module.id) === Number(lesson.learning_path_id))

  if (!moduleState || moduleState.estado === 'bloqueado') {
    throw AppError.forbidden('Este módulo está bloqueado.')
  }

  const [requiredRows] = await pool.query(
    `SELECT COUNT(*) AS total_required
     FROM lessons
     WHERE learning_path_id = ?
       AND is_published = 1
       AND order_position < ?`,
    [lesson.learning_path_id, lesson.order_position]
  )

  const [completedRows] = await pool.query(
    `SELECT COUNT(*) AS total_completed
     FROM user_progress up
     JOIN lessons l ON l.id = up.lesson_id
     WHERE up.user_id = ?
       AND l.learning_path_id = ?
       AND l.is_published = 1
       AND l.order_position < ?
       AND up.status = 'completed'`,
    [userId, lesson.learning_path_id, lesson.order_position]
  )

  if (Number(completedRows[0]?.total_completed || 0) < Number(requiredRows[0]?.total_required || 0)) {
    throw AppError.forbidden('Debes completar las lecciones anteriores primero.')
  }

  await pool.query(
    `INSERT INTO user_progress (user_id, lesson_id, status, started_at, last_accessed_at, submission_count)
     VALUES (?, ?, 'in_progress', NOW(), NOW(), 0)
     ON DUPLICATE KEY UPDATE
       started_at = COALESCE(started_at, NOW()),
       status = IF(status = 'completed', 'completed', 'in_progress'),
       last_accessed_at = NOW()`,
    [userId, lessonId]
  )

  const [testCases] = await pool.query(
    `SELECT tc.id,
            tc.input_data,
            tc.expected_output,
            tc.is_hidden,
            tc.points,
            tc.order_position,
            ls.explanation
     FROM lesson_test_cases tc
     LEFT JOIN lesson_solutions ls ON ls.lesson_id = tc.lesson_id
     WHERE tc.lesson_id = ?
     ORDER BY tc.order_position, tc.id`,
    [lessonId]
  )

  const [acceptedRows] = await pool.query(
    `SELECT DISTINCT judge0_submission_id
     FROM user_submissions
     WHERE user_id = ?
       AND lesson_id = ?
       AND status = 'accepted'
       AND judge0_submission_id LIKE 'tc:%'`,
    [userId, lessonId]
  )

  const acceptedCaseIds = new Set(
    acceptedRows
      .map((row) => String(row.judge0_submission_id || '').replace('tc:', ''))
      .filter((value) => value.length > 0)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  )

  const exercises = testCases.map((testCase) => {
    const inputText = String(testCase.input_data || '').trim()
    const statement = testCase.is_hidden
      ? `Caso de prueba ${testCase.order_position}. Escribe la salida esperada para este caso oculto.`
      : `Caso de prueba ${testCase.order_position}. Input: ${inputText || '(vacio)'}. Escribe la salida exacta.`

    return {
      id: Number(testCase.id),
      tipo: 'completar_codigo',
      enunciado: statement,
      codigo_base: '',
      opciones: null,
      pista:
        testCase.explanation ||
        'Revisa mayusculas, espacios y saltos de linea antes de enviar la respuesta.',
      xp_recompensa: Number(testCase.points || 10),
      numero: Number(testCase.order_position || 1),
      resuelto: acceptedCaseIds.has(Number(testCase.id)),
    }
  })

  if (exercises.length === 0) {
    const [progressRows] = await pool.query(
      `SELECT status
       FROM user_progress
       WHERE user_id = ? AND lesson_id = ?
       LIMIT 1`,
      [userId, lessonId]
    )

    exercises.push({
      id: SYNTHETIC_EXERCISE_OFFSET + Number(lesson.id),
      tipo: 'completar_codigo',
      enunciado:
        'Escribe una breve conclusion de lo aprendido para marcar esta leccion como completada.',
      codigo_base: '',
      opciones: null,
      pista: 'Puedes escribir una frase corta, por ejemplo: "Leccion completada".',
      xp_recompensa: 10,
      numero: 1,
      resuelto: progressRows[0]?.status === 'completed',
    })
  }

  return res.status(200).json({
    lesson: {
      id: lesson.id,
      titulo: lesson.title,
      descripcion: lesson.description,
      contenido_teoria: lesson.content,
      tipo: 'teoria_practica',
      xp_recompensa: DEFAULT_LESSON_XP,
      modulo_nombre: lesson.modulo_nombre,
      lenguaje_id: lesson.lenguaje_id,
    },
    exercises,
  })
})

/**
 * POST /api/lessons/exercise/submit
 * Body: { exerciseId, answer }
 * Evalúa la respuesta del usuario.
 */
const submitExercise = asyncHandler(async (req, res) => {
  const exerciseId = parsePositiveInt(req.body.exerciseId, 'exerciseId')
  const answer = req.body.answer

  if (answer === undefined) {
    throw AppError.badRequest('answer es obligatorio.')
  }

  const result = await lessonProgressService.submitExercise({
    userId: req.user.id,
    exerciseId,
    answer,
  })

  return res.status(200).json(result)
})

module.exports = { getModules, getLessons, getLessonContent, submitExercise }
