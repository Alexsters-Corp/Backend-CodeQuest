// g:/IUP - Yamith Alexander Ardila Cabrera/PSW3/CodeQuest Project/Backend-CodeQuest/services/learning-service/src/routes/ai.js
const express = require('express')
const { AppError, authorize, requireFields, parseString } = require('@codequest/shared')
const requireGatewayUser = require('../middleware/require-gateway-user')
const { instructorAiLimit, userAiLimit } = require('../middleware/rateLimiter')
const { env } = require('../config/env')
const { groqContentService, groqEvaluationService, pool } = require('../services/container')

const router = express.Router()

function ensureAiEnabled(req, res, next) {
  if (!env.features.aiContent) {
    return res.status(503).json({
      error: 'AI features are disabled',
      code: 'AI_DISABLED',
    })
  }

  return next()
}

function sendError(res, error) {
  const isAppError = error instanceof AppError
  const status = isAppError ? error.statusCode : 500
  const message = isAppError ? error.message : 'Error interno del servidor.'
  const code = isAppError ? error.code : 'INTERNAL_ERROR'

  return res.status(status).json({
    error: message,
    code,
  })
}

router.post(
  '/admin/generate-lesson',
  ensureAiEnabled,
  requireGatewayUser,
  authorize('instructor', 'admin'),
  instructorAiLimit,
  async (req, res) => {
    try {
      requireFields(req.body, ['topic', 'language', 'level'])
      const topic = parseString(req.body.topic, 'topic')
      const language = parseString(req.body.language, 'language')
      const level = parseString(req.body.level, 'level')

      const payload = await groqContentService.generateLesson(topic, language, level, req.user.id)
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

      if (!Number.isInteger(languageId) || languageId <= 0) {
        throw AppError.badRequest('languageId debe ser un entero positivo.', 'VALIDATION_ERROR')
      }

      const payload = await groqContentService.generateExercise(concept, difficulty, languageId, req.user.id)
      return res.status(200).json(payload)
    } catch (error) {
      return sendError(res, error)
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
