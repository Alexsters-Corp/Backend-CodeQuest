const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

function getRequestLocale(req) {
  return String(req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'es'
}

const getLessonSolution = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')

  const solution = await learningService.getLessonSolution({
    lessonId,
    userId: req.user.id,
    locale: getRequestLocale(req),
  })

  return res.status(200).json(solution)
})

module.exports = {
  getLessonSolution,
}
