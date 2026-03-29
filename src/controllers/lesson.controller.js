const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')
const LessonProgressService = require('../services/lessonProgress.service')

const lessonProgressService = new LessonProgressService({ pool })

/**
 * GET /api/lessons/modules?languageId=1
 * Lista módulos de un lenguaje con su progreso para el usuario.
 */
const getModules = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.query.languageId, 'languageId')
  const userId = req.user.id

  const [modules] = await pool.query(
    `SELECT m.id, m.nombre, m.descripcion, m.numero, m.icono, m.xp_recompensa,
            COALESCE(pm.estado, 'bloqueado') AS estado,
            COALESCE(pm.porcentaje, 0) AS porcentaje
     FROM modulos m
     LEFT JOIN progreso_modulo pm ON pm.modulo_id = m.id AND pm.usuario_id = ?
     WHERE m.lenguaje_id = ? AND m.activo = 1
     ORDER BY m.numero`,
    [userId, languageId]
  )

  return res.status(200).json(modules)
})

/**
 * GET /api/lessons/module/:moduleId
 * Lista lecciones de un módulo con su progreso.
 */
const getLessons = asyncHandler(async (req, res) => {
  const moduleId = parsePositiveInt(req.params.moduleId, 'moduleId')
  const userId = req.user.id

  const [progressRows] = await pool.query(
    `SELECT estado FROM progreso_modulo WHERE modulo_id = ? AND usuario_id = ?`,
    [moduleId, userId]
  )

  if (progressRows.length > 0 && progressRows[0].estado === 'bloqueado') {
    throw AppError.forbidden('Este módulo está bloqueado.')
  }

  const [lessons] = await pool.query(
    `SELECT l.id, l.titulo, l.descripcion, l.numero, l.tipo, l.xp_recompensa,
            COALESCE(pl.estado, 'bloqueado') AS estado,
            pl.puntuacion_mejor
     FROM lecciones l
     LEFT JOIN progreso_leccion pl ON pl.leccion_id = l.id AND pl.usuario_id = ?
     WHERE l.modulo_id = ? AND l.activo = 1
     ORDER BY l.numero`,
    [userId, moduleId]
  )

  const anyUnlocked = lessons.some((lesson) => lesson.estado !== 'bloqueado')
  if (!anyUnlocked && lessons.length > 0) {
    lessons[0].estado = 'disponible'
    await pool.query(
      `INSERT IGNORE INTO progreso_leccion (usuario_id, leccion_id, estado, fecha_inicio)
       VALUES (?, ?, 'disponible', NOW())`,
      [userId, lessons[0].id]
    )
  }

  return res.status(200).json(lessons)
})

/**
 * GET /api/lessons/:lessonId
 * Obtiene el contenido de una lección: teoría + ejercicios.
 */
const getLessonContent = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')
  const userId = req.user.id

  const [lessons] = await pool.query(
    `SELECT l.*, m.nombre AS modulo_nombre, m.lenguaje_id
     FROM lecciones l
     JOIN modulos m ON m.id = l.modulo_id
     WHERE l.id = ?`,
    [lessonId]
  )

  if (lessons.length === 0) {
    throw AppError.notFound('Lección no encontrada.')
  }

  const lesson = lessons[0]

  const [exercises] = await pool.query(
    `SELECT id, tipo, enunciado, codigo_base, opciones, pista, xp_recompensa, numero
     FROM ejercicios
     WHERE leccion_id = ? AND activo = 1
     ORDER BY numero`,
    [lessonId]
  )

  for (const exercise of exercises) {
    if (typeof exercise.opciones === 'string') {
      try {
        exercise.opciones = JSON.parse(exercise.opciones)
      } catch (_error) {
        exercise.opciones = null
      }
    }
  }

  const exerciseIds = exercises.map((exercise) => exercise.id)
  let attempts = []

  if (exerciseIds.length > 0) {
    const [rows] = await pool.query(
      `SELECT ejercicio_id, MAX(es_correcto) AS resuelto
       FROM intentos_ejercicio
       WHERE usuario_id = ? AND ejercicio_id IN (?)
       GROUP BY ejercicio_id`,
      [userId, exerciseIds]
    )
    attempts = rows
  }

  const attemptMap = {}
  for (const attempt of attempts) {
    attemptMap[attempt.ejercicio_id] = !!attempt.resuelto
  }

  for (const exercise of exercises) {
    exercise.resuelto = attemptMap[exercise.id] || false
  }

  return res.status(200).json({
    lesson: {
      id: lesson.id,
      titulo: lesson.titulo,
      descripcion: lesson.descripcion,
      contenido_teoria: lesson.contenido_teoria,
      tipo: lesson.tipo,
      xp_recompensa: lesson.xp_recompensa,
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
