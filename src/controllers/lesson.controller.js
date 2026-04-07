const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')
const LessonProgressService = require('../services/lessonProgress.service')

const lessonProgressService = new LessonProgressService({ pool })
const DEFAULT_LESSON_XP = 50

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
    `SELECT learning_path_id
     FROM user_learning_paths
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  )

  let selectedPathId = Number(selectedRows[0]?.learning_path_id || 0)
  const hasSelectedPathInLanguage = paths.some((path) => Number(path.id) === selectedPathId)

  if (!hasSelectedPathInLanguage) {
    selectedPathId = Number(paths[0].id)
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

module.exports = { getModules, getLessons, submitExercise }
