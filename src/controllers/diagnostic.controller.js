const pool = require('../config/db')
const AppError = require('../core/errors/AppError')
const asyncHandler = require('../core/http/asyncHandler')
const { parsePositiveInt } = require('../core/validation/request')
const DiagnosticService = require('../services/diagnostic.service')

const diagnosticService = new DiagnosticService({ pool })

/**
 * GET /api/diagnostic/start?languageId=1
 * Inicia el test diagnóstico. Devuelve la primera pregunta de dificultad media.
 */
const startTest = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.query.languageId, 'languageId')

  const result = await diagnosticService.startTest({
    userId: req.user.id,
    languageId,
  })

  return res.status(200).json(result)
})

/**
 * POST /api/diagnostic/answer
 * Body: { languageId, questionId, answer }
 * Registra respuesta y devuelve la siguiente pregunta adaptativa.
 */
const submitAnswer = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body.languageId, 'languageId')
  const questionId = parsePositiveInt(req.body.questionId, 'questionId')
  const answer = req.body.answer

  if (answer === undefined) {
    throw AppError.badRequest('answer es obligatorio.')
  }

  const result = await diagnosticService.submitAnswer({
    userId: req.user.id,
    languageId,
    questionId,
    answer,
  })

  return res.status(200).json(result)
})

/**
 * POST /api/diagnostic/finish
 * Body: { languageId }
 * Finaliza el test y guarda el resultado.
 */
const finishTest = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body.languageId, 'languageId')

  const result = await diagnosticService.finishTest({
    userId: req.user.id,
    languageId,
  })

  return res.status(200).json(result)
})

module.exports = { startTest, submitAnswer, finishTest }
