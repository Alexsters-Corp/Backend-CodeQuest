const { asyncHandler, parsePositiveInt } = require('@codequest/shared')
const { learningService } = require('../services/container')

const getLessonSolution = asyncHandler(async (req, res) => {
  const lessonId = parsePositiveInt(req.params.lessonId, 'lessonId')

  const solution = await learningService.getLessonSolution({
    lessonId,
    userId: req.user.id,
  })

  return res.status(200).json(solution)
})

module.exports = {
  getLessonSolution,
}
