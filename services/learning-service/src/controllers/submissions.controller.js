const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const submitSolution = asyncHandler(async (req, res) => {
  const { lessonId, languageId, code, testCasesPassed, testCasesTotal, status } = req.body

  const parsedLessonId = parsePositiveInt(lessonId, 'lessonId')

  const result = await learningService.submitSolution({
    userId: req.user.id,
    lessonId: parsedLessonId,
    languageId: Number(languageId),
    code: String(code || ''),
    testCasesPassed: Number(testCasesPassed ?? 0),
    testCasesTotal: Number(testCasesTotal ?? 0),
    status: String(status || 'wrong_answer'),
  })

  return res.status(201).json(result)
})

module.exports = {
  submitSolution,
}
