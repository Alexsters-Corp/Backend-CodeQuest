// CodeQuest AI API routes.
const express = require('express')
const { AppError, authorize, requireFields, parseString } = require('@codequest/shared')
const requireGatewayUser = require('../middleware/require-gateway-user')
const { instructorAiLimit, userAiLimit } = require('../middleware/rateLimiter')
const { env } = require('../config/env')
const { groqContentService, groqEvaluationService, pool } = require('../services/container')

const router = express.Router()

// Judge0 language ID to language name mapping
const JUDGE0_LANGUAGE_MAP = {
  '63': 'javascript',
  '71': 'python',
  '62': 'java',
  '54': 'cpp',
  '51': 'csharp',
  '60': 'go',
  '72': 'ruby',
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

      const language = JUDGE0_LANGUAGE_MAP[String(languageId)]
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
  authorize('admin'),
  instructorAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['content', 'languageId', 'level', 'validation'])
      const languageId = Number(req.body.languageId)
      const level = parseString(req.body.level, 'level')
      const learningPathId = req.body.learningPathId ? Number(req.body.learningPathId) : null

      if (!Number.isInteger(languageId) || languageId <= 0) {
        throw AppError.badRequest('languageId debe ser un entero positivo.', 'VALIDATION_ERROR')
      }

      const payload = await groqContentService.publishGeneratedLesson({
        content: req.body.content,
        languageId,
        level,
        validation: req.body.validation,
        publishedBy: req.user.id,
        learningPathId,
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
           lp.difficulty_level
         FROM programming_languages pl
         LEFT JOIN learning_paths lp
           ON lp.programming_language_id = pl.id
          AND lp.is_active = 1
         WHERE pl.is_active = 1
         ORDER BY pl.name ASC, FIELD(lp.difficulty_level, 'principiante', 'intermedio', 'avanzado'), lp.id ASC`
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
            difficultyLevel: row.difficulty_level,
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

      const payload = await groqEvaluationService.generatePersonalizedFeedback(req.user.id, mistakes)
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
