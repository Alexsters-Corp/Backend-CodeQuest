const pool = require('../config/db')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')
const LessonsRepository = require('../repositories/lessons.repository')

const lessonsRepository = new LessonsRepository({ pool })
const SYNTHETIC_EXERCISE_OFFSET = 900000000

function parseBooleanQuery(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const normalized = String(value).trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return defaultValue
}

function buildUserProgress(progressRow) {
  if (!progressRow) {
    return {
      status: 'not_started',
      started_at: null,
      completed_at: null,
      xp_earned: 0,
      submission_count: 0,
      is_completed: false,
      last_accessed_at: null,
    }
  }

  return {
    status: progressRow.status,
    started_at: progressRow.started_at,
    completed_at: progressRow.completed_at,
    xp_earned: Number(progressRow.xp_earned || 0),
    submission_count: Number(progressRow.submission_count || 0),
    is_completed: progressRow.status === 'completed',
    last_accessed_at: progressRow.last_accessed_at,
  }
}

function buildLessonPayload(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    content: lesson.content,
    order_position: lesson.order_position,
    estimated_minutes: lesson.estimated_minutes,
    xp_reward: lesson.xp_reward,
    is_free_demo: lesson.is_free_demo,
    learning_path: lesson.learning_path,
  }
}

function buildLegacyLessonPayload(lesson) {
  return {
    id: lesson.id,
    titulo: lesson.title,
    descripcion: lesson.description,
    contenido_teoria: lesson.content,
    tipo: 'teoria_practica',
    xp_recompensa: lesson.xp_reward,
    modulo_nombre: lesson.learning_path.name,
    lenguaje_id: lesson.learning_path.language.id,
  }
}

async function buildLegacyExercises({ userId, lessonId, userProgress }) {
  if (!userId) {
    return []
  }

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
    const status = userProgress?.status || 'not_started'

    exercises.push({
      id: SYNTHETIC_EXERCISE_OFFSET + Number(lessonId),
      tipo: 'completar_codigo',
      enunciado:
        'Escribe una breve conclusion de lo aprendido para marcar esta leccion como completada.',
      codigo_base: '',
      opciones: null,
      pista: 'Puedes escribir una frase corta, por ejemplo: "Leccion completada".',
      xp_recompensa: 10,
      numero: 1,
      resuelto: status === 'completed',
    })
  }

  return exercises
}

const getLessonById = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.id, 'id')
  const includeProgress = parseBooleanQuery(req.query.include_progress, true)
  const includeNavigation = parseBooleanQuery(req.query.include_navigation, true)

  const lesson = req.lesson || (await lessonsRepository.findById(lessonId))
  const userId = req.user?.id ? Number(req.user.id) : null
  const isAuthenticated = Number.isInteger(userId) && userId > 0

  let userProgress = null
  if (includeProgress && isAuthenticated) {
    const progressRow = await lessonsRepository.getUserProgress({ userId, lessonId })
    userProgress = buildUserProgress(progressRow)
  } else if (includeProgress) {
    userProgress = buildUserProgress(null)
  }

  let navigation = null
  if (includeNavigation) {
    navigation = await lessonsRepository.findLessonNavigation({
      learningPathId: lesson.learning_path.id,
      orderPosition: lesson.order_position,
      userId: isAuthenticated ? userId : null,
    })
  }

  const legacyExercises = await buildLegacyExercises({
    userId,
    lessonId,
    userProgress,
  })

  if (isAuthenticated) {
    setImmediate(() => {
      lessonsRepository
        .updateLastAccessed({ userId, lessonId })
        .catch((error) => {
          console.error('[LessonAccessUpdateError]', {
            userId,
            lessonId,
            message: error.message,
          })
        })
    })
  }

  console.info(
    '[LessonAccess]',
    JSON.stringify({
      userId: isAuthenticated ? userId : null,
      lessonId,
      learningPathId: lesson.learning_path.id,
      freeDemo: lesson.is_free_demo,
      includeProgress,
      includeNavigation,
    })
  )

  const data = {
    lesson: buildLessonPayload(lesson),
  }

  if (includeProgress) {
    data.user_progress = userProgress
  }

  if (includeNavigation) {
    data.navigation = navigation
  }

  res.setHeader(
    'Cache-Control',
    lesson.is_free_demo ? 'public, max-age=300' : 'private, max-age=0, must-revalidate'
  )

  return res.status(200).json({
    success: true,
    data,
    meta: {
      accessed_at: new Date().toISOString(),
      is_authenticated: isAuthenticated,
      is_free_demo: Boolean(lesson.is_free_demo),
    },

    // Compatibilidad con frontend actual
    lesson: buildLegacyLessonPayload(lesson),
    exercises: legacyExercises,
  })
})

module.exports = {
  getLessonById,
}
