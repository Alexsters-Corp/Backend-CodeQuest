const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const startDiagnostic = asyncHandler(async (req, res) => {
  const languageId = parsePositiveInt(req.body?.languageId, 'languageId')

  const result = await learningService.startDiagnostic({
    userId: req.user.id,
    languageId,
  })

  return res.status(200).json(result)
})

const finishDiagnostic = asyncHandler(async (req, res) => {
  const attemptId = parsePositiveInt(req.params.attemptId, 'attemptId')
  const answers = req.body?.answers

  const result = await learningService.finishDiagnostic({
    userId: req.user.id,
    attemptId,
    answers,
  })

  return res.status(200).json(result)
})

module.exports = {
  startDiagnostic,
  finishDiagnostic,
}
