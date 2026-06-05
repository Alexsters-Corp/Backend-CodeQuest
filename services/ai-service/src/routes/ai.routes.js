// CodeQuest AI API routes.
const express = require('express')
const { AppError, authorize, requireFields, parseString } = require('@codequest/shared')
const requireGatewayUser = require('../middleware/require-gateway-user')
const { instructorAiLimit, userAiLimit } = require('../middleware/rateLimiter')
const { env } = require('../config/env')
const { groqContentService, groqEvaluationService, pool } = require('../services/container')

const router = express.Router()
const INSTRUCTOR_DAILY_PUBLISH_LIMIT = Number(process.env.AI_INSTRUCTOR_DAILY_PUBLISH_LIMIT || 12)

// Accept both Judge0 IDs and internal programming language IDs.
const LANGUAGE_MAP = {
  // Judge0 IDs
  '63': 'javascript',
  '71': 'python',
  '62': 'java',
  '54': 'cpp',
  '51': 'csharp',
  '60': 'go',
  '72': 'ruby',
  // Internal programming_languages IDs
  '1': 'python',
  '2': 'javascript',
  '3': 'java',
  '4': 'cpp',
  '5': 'csharp',
  '6': 'go',
  '7': 'ruby',
}

const LANGUAGE_TO_JUDGE0_ID = {
  '63': 63,
  '71': 71,
  '62': 62,
  '54': 54,
  '51': 51,
  '60': 60,
  '72': 72,
  '1': 71,
  '2': 63,
  '3': 62,
  '4': 54,
  '5': 51,
  '6': 60,
  '7': 72,
}

function resolveJudge0LanguageId(languageId) {
  const resolved = LANGUAGE_TO_JUDGE0_ID[String(languageId)]
  return Number.isInteger(resolved) ? resolved : null
}

function ensureAiEnabled(req, res, next) {
  if (!env.features.aiContent) {
    return res.status(503).json({
      error: 'AI features are disabled',
      code: 'AI_DISABLED',
    })
  }

  return next()
}

function sendError(res, error, fallbackCode = 'INTERNAL_ERROR', options = {}) {
  const isAppError = error instanceof AppError
  const status = isAppError ? error.statusCode : 500
  const message = isAppError ? error.message : 'Error interno del servidor.'
  const code = options.forceCode ? fallbackCode : (isAppError ? error.code : fallbackCode)
  const payload = {
    error: message,
    code,
  }

  if (env.nodeEnv !== 'production') {
    payload.detail = error?.details || error?.stack || error?.message || null
  }

  return res.status(status).json(payload)
}

async function assertInstructorPublishAccess({ userId, classId, learningPathId, languageId }) {
  if (!Number.isInteger(classId) || classId <= 0) {
    throw AppError.badRequest('classId es requerido para publicar como instructor.', 'VALIDATION_ERROR')
  }

  const [ownedClassRows] = await pool.query(
    `SELECT id
     FROM instructor_classes
     WHERE id = ?
       AND instructor_user_id = ?
       AND is_active = 1
     LIMIT 1`,
    [classId, userId]
  )

  if (!ownedClassRows[0]) {
    throw AppError.forbidden('No puedes publicar contenido para una clase que no te pertenece.', 'CLASS_FORBIDDEN')
  }

  const requestedJudge0LanguageId = resolveJudge0LanguageId(languageId)
  let resolvedLearningPathId = Number.isInteger(learningPathId) && learningPathId > 0 ? learningPathId : null
  let resolvedJudge0LanguageId = requestedJudge0LanguageId

  if (resolvedLearningPathId) {
    const [assignedPathRows] = await pool.query(
      `SELECT clp.learning_path_id, pl.judge0_language_id
       FROM class_learning_paths clp
       JOIN learning_paths lp ON lp.id = clp.learning_path_id
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       WHERE clp.class_id = ?
         AND clp.learning_path_id = ?
       LIMIT 1`,
      [classId, resolvedLearningPathId]
    )

    if (!assignedPathRows[0]) {
      throw AppError.badRequest('La ruta seleccionada no está asignada a esta clase.', 'PATH_NOT_ASSIGNED_TO_CLASS')
    }

    resolvedJudge0LanguageId = Number(assignedPathRows[0].judge0_language_id) || resolvedJudge0LanguageId
  } else {
    const [classPathsRows] = await pool.query(
      `SELECT clp.learning_path_id, clp.is_required, pl.judge0_language_id
       FROM class_learning_paths clp
       JOIN learning_paths lp ON lp.id = clp.learning_path_id
       JOIN programming_languages pl ON pl.id = lp.programming_language_id
       WHERE clp.class_id = ?
       ORDER BY clp.is_required DESC, clp.id ASC`,
      [classId]
    )

    if (!classPathsRows.length) {
      // When no route is assigned to the class, allow direct publish and let the
      // content service resolve/create a suitable path from language and level.
      resolvedLearningPathId = null
      resolvedJudge0LanguageId = requestedJudge0LanguageId
    } else {
      const selectedPath = requestedJudge0LanguageId
        ? (classPathsRows.find((row) => Number(row.judge0_language_id) === requestedJudge0LanguageId) || classPathsRows[0])
        : classPathsRows[0]

      resolvedLearningPathId = Number(selectedPath.learning_path_id)
      resolvedJudge0LanguageId = Number(selectedPath.judge0_language_id) || resolvedJudge0LanguageId
    }
  }

  if (requestedJudge0LanguageId && requestedJudge0LanguageId !== resolvedJudge0LanguageId) {
    throw AppError.badRequest(
      'El lenguaje seleccionado no coincide con la ruta asignada a la clase.',
      'LANGUAGE_ROUTE_MISMATCH'
    )
  }

  const [dailyRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM ai_generated_content
     WHERE created_by = ?
       AND published = 1
       AND DATE(generated_at) = CURRENT_DATE()`,
    [userId]
  )

  const publishedToday = Number(dailyRows?.[0]?.total || 0)
  if (publishedToday >= INSTRUCTOR_DAILY_PUBLISH_LIMIT) {
    throw AppError.forbidden(
      `Has alcanzado tu límite diario de publicaciones (${INSTRUCTOR_DAILY_PUBLISH_LIMIT}).`,
      'INSTRUCTOR_DAILY_PUBLISH_LIMIT'
    )
  }

  return {
    learningPathId: resolvedLearningPathId,
    languageId: resolvedJudge0LanguageId,
  }
}

router.post(
  '/admin/generate-lesson',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('instructor', 'admin'),
  instructorAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['topic', 'languageId', 'level'])
      const topic = parseString(req.body.topic, 'topic')
      const languageId = Number(req.body.languageId)
      const level = parseString(req.body.level, 'level')
      const model = req.body.model ? parseString(req.body.model, 'model') : undefined

      if (!Number.isInteger(languageId) || languageId <= 0) {
        throw AppError.badRequest('languageId debe ser un entero positivo.', 'VALIDATION_ERROR')
      }

      const language = LANGUAGE_MAP[String(languageId)]
      if (!language) {
        throw AppError.badRequest('languageId no es válido.', 'VALIDATION_ERROR')
      }

      const payload = await groqContentService.generateLesson(topic, language, level, req.user.id, model)
      return res.status(200).json(payload)
    } catch (error) {
      return sendError(res, error)
    }
  }
)

router.post(
  '/admin/generate-exercise',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('instructor', 'admin'),
  instructorAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['concept', 'difficulty', 'languageId'])
      const concept = parseString(req.body.concept, 'concept')
      const difficulty = parseString(req.body.difficulty, 'difficulty')
      const languageId = Number(req.body.languageId)
      const model = req.body.model ? parseString(req.body.model, 'model') : undefined

      if (!Number.isInteger(languageId) || languageId <= 0) {
        throw AppError.badRequest('languageId debe ser un entero positivo.', 'VALIDATION_ERROR')
      }

      const payload = await groqContentService.generateExercise(concept, difficulty, languageId, req.user.id, model)
      return res.status(200).json(payload)
    } catch (error) {
      console.error('[generate-exercise] Error:', error.message, error.stack)
      return sendError(res, error, 'EXERCISE_GENERATION_FAILED', { forceCode: true })
    }
  }
)

router.post(
  '/admin/validate-content',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('instructor', 'admin'),
  instructorAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['content'])
      const result = await groqContentService.validateContentQuality(req.body.content)
      return res.status(200).json(result)
    } catch (error) {
      return sendError(res, error)
    }
  }
)

router.post(
  '/admin/publish-content',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('instructor', 'admin'),
  instructorAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['content', 'languageId', 'level', 'validation'])
      const languageId = Number(req.body.languageId)
      const level = parseString(req.body.level, 'level')
      const learningPathId = req.body.learningPathId ? Number(req.body.learningPathId) : null
      const classId = req.body.classId ? Number(req.body.classId) : null

      if (!Number.isInteger(languageId) || languageId <= 0) {
        throw AppError.badRequest('languageId debe ser un entero positivo.', 'VALIDATION_ERROR')
      }

      let effectiveLanguageId = languageId
      let effectiveLearningPathId = learningPathId

      if (req.user.role === 'instructor') {
        const resolved = await assertInstructorPublishAccess({
          userId: req.user.id,
          classId,
          learningPathId: effectiveLearningPathId,
          languageId: effectiveLanguageId,
        })
        effectiveLearningPathId = resolved.learningPathId
        effectiveLanguageId = resolved.languageId
      }

      const payload = await groqContentService.publishGeneratedLesson({
        content: req.body.content,
        languageId: effectiveLanguageId,
        level,
        validation: req.body.validation,
        publishedBy: req.user.id,
        classId,
        learningPathId: effectiveLearningPathId,
      })

      return res.status(201).json(payload)
    } catch (error) {
      console.error('[publish-content] Error:', error.message, error.details || error.stack)
      return sendError(res, error, 'CONTENT_PUBLISH_FAILED', { forceCode: true })
    }
  }
)

router.get(
  '/admin/publish-targets',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('admin'),
  async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT
           pl.id AS language_id,
           pl.name AS language_name,
           pl.slug AS language_slug,
           pl.judge0_language_id,
           lp.id AS path_id,
           lp.name AS path_name,
           lp.slug AS path_slug,
           lp.difficulty_level,
           COALESCE(lp.is_optional, 0) AS path_is_optional,
           COALESCE(lp.order_position, 999) AS path_order_position
         FROM programming_languages pl
         LEFT JOIN learning_paths lp
           ON lp.programming_language_id = pl.id
          AND lp.is_active = 1
         WHERE pl.is_active = 1
         ORDER BY
           pl.name ASC,
           COALESCE(lp.order_position, 999) ASC,
           FIELD(lp.difficulty_level, 'principiante', 'intermedio', 'avanzado') ASC,
           lp.id ASC`
      )

      const languages = new Map()
      rows.forEach((row) => {
        const key = Number(row.judge0_language_id)
        if (!languages.has(key)) {
          languages.set(key, {
            id: Number(row.language_id),
            name: row.language_name,
            slug: row.language_slug,
            judge0LanguageId: key,
            paths: [],
          })
        }

        if (row.path_id) {
          languages.get(key).paths.push({
            id: Number(row.path_id),
            name: row.path_name,
            slug: row.path_slug,
            difficultyLevel: row.difficulty_level,
            isOptional: Boolean(row.path_is_optional),
            orderPosition: Number(row.path_order_position || 999),
          })
        }
      })

      return res.json({ languages: Array.from(languages.values()) })
    } catch (error) {
      return sendError(res, error, 'PUBLISH_TARGETS_FAILED', { forceCode: true })
    }
  }
)

router.post(
  '/learning/evaluate-explanation',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('user'),
  userAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['studentAnswer', 'expectedConcepts'])
      const studentAnswer = parseString(req.body.studentAnswer, 'studentAnswer', { minLength: 3 })
      const expectedConcepts = Array.isArray(req.body.expectedConcepts) ? req.body.expectedConcepts : []

      const payload = await groqEvaluationService.evaluateExplanation(studentAnswer, expectedConcepts)
      return res.status(200).json(payload)
    } catch (error) {
      return sendError(res, error)
    }
  }
)

router.get(
  '/learning/recommendations',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('user'),
  userAiLimit,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT evaluation_result
         FROM ai_evaluations
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [req.user.id]
      )

      const mistakes = rows
        .map((row) => {
          try {
            const payload = JSON.parse(row.evaluation_result || '{}')
            return payload.feedback || ''
          } catch (_error) {
            return ''
          }
        })
        .filter(Boolean)

      const payload = await groqEvaluationService.recommendLessons(req.user.id, mistakes)
      return res.status(200).json(payload)
    } catch (error) {
      return sendError(res, error)
    }
  }
)

router.use((error, _req, res, _next) => {
  return sendError(res, error)
})

module.exports = router
